import BaseService from './BaseService.js';
import db from '../models/database.js';

// 前缀缓存亲和性 - 基于 model 前缀的渠道匹配缓存
const prefixCache = new Map();
const PREFIX_CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

class ProxyService extends BaseService {
  constructor() {
    super();
    this.db = db;
  }

  // 初始化表
  initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        base_url TEXT NOT NULL,
        api_type TEXT DEFAULT 'openai',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS provider_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider_id INTEGER NOT NULL,
        api_key TEXT NOT NULL,
        weight INTEGER DEFAULT 1,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS model_mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider_id INTEGER NOT NULL,
        model_name TEXT NOT NULL,
        mapped_model TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
        UNIQUE(provider_id, model_name)
      );
    `);
  }

  // 获取所有活跃渠道
  getActiveProviders() {
    this.initTables();
    return this.db.prepare(`
      SELECT p.*, 
        (SELECT api_key FROM provider_keys WHERE provider_id = p.id AND status = 'active' LIMIT 1) as api_key
      FROM providers p 
      WHERE p.status = 'active'
    `).all();
  }

  // 获取渠道的所有 Key（带权重）
  getProviderKeys(providerId) {
    return this.db.prepare(`
      SELECT * FROM provider_keys 
      WHERE provider_id = ? AND status = 'active'
      ORDER BY weight DESC
    `).all(providerId);
  }

  // 根据 model 前缀查找映射的渠道
  findProviderByModelPrefix(model) {
    // 检查缓存
    const now = Date.now();
    if (prefixCache.has(model)) {
      const cached = prefixCache.get(model);
      if (now - cached.timestamp < PREFIX_CACHE_TTL) {
        return cached.provider;
      }
      prefixCache.delete(model);
    }

    this.initTables();

    // 查找匹配的模型映射
    const mapping = this.db.prepare(`
      SELECT mm.*, p.base_url, p.api_type,
        (SELECT api_key FROM provider_keys WHERE provider_id = p.id AND status = 'active' LIMIT 1) as api_key
      FROM model_mappings mm
      JOIN providers p ON mm.provider_id = p.id
      WHERE mm.model_name = ? AND p.status = 'active'
    `).get(model);

    if (mapping) {
      // 缓存结果
      prefixCache.set(model, { provider: mapping, timestamp: now });
      return mapping;
    }

    // 前缀匹配 - 查找最长匹配的前缀
    const allMappings = this.db.prepare(`
      SELECT mm.*, p.base_url, p.api_type,
        (SELECT api_key FROM provider_keys WHERE provider_id = p.id AND status = 'active' LIMIT 1) as api_key
      FROM model_mappings mm
      JOIN providers p ON mm.provider_id = p.id
      WHERE p.status = 'active'
    `).all();

    let bestMatch = null;
    let bestPrefixLength = 0;

    for (const m of allMappings) {
      if (model.startsWith(m.model_name) && m.model_name.length > bestPrefixLength) {
        bestMatch = m;
        bestPrefixLength = m.model_name.length;
      }
    }

    if (bestMatch) {
      prefixCache.set(model, { provider: bestMatch, timestamp: now });
    }

    return bestMatch;
  }

  // 轮询负载均衡 - 基于权重选择 Key
  selectKeyByWeight(keys) {
    if (!keys || keys.length === 0) return null;
    if (keys.length === 1) return keys[0];

    const totalWeight = keys.reduce((sum, k) => sum + k.weight, 0);
    let random = Math.random() * totalWeight;

    for (const key of keys) {
      random -= key.weight;
      if (random <= 0) return key;
    }

    return keys[0];
  }

  // 更新统计
  updateStats(providerId, tokens = 0, cost = 0) {
    try {
      this.db.prepare(`
        INSERT INTO stats (provider_id, date, request_count, token_count, cost)
        VALUES (?, date('now'), 1, ?, ?)
        ON CONFLICT(provider_id, date) DO UPDATE SET
          request_count = request_count + 1,
          token_count = token_count + ?,
          cost = cost + ?
      `).run(providerId, tokens, cost, tokens, cost);
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  // 处理聊天完成请求
  async handleChatCompletion(req, res) {
    try {
      this.initTables();

      const { model, stream } = req.body;
      const providerHeader = req.headers['x-all-api-provider'];

      let provider;
      let apiKey;
      let baseUrl;
      let mappedModel = model;

      // 优先使用 Header 指定的渠道
      if (providerHeader) {
        const p = this.db.prepare(`
          SELECT p.*,
            (SELECT api_key FROM provider_keys WHERE provider_id = p.id AND status = 'active' LIMIT 1) as api_key
          FROM providers p WHERE p.name = ? OR p.id = ?
        `).get(providerHeader, providerHeader);

        if (!p) {
          return res.status(404).json({ error: 'Provider not found' });
        }
        provider = p;
        apiKey = p.api_key;
        baseUrl = p.base_url;

        // 检查是否有模型映射
        const mapping = this.db.prepare(`
          SELECT mapped_model FROM model_mappings 
          WHERE provider_id = ? AND model_name = ?
        `).get(p.id, model);
        if (mapping) {
          mappedModel = mapping.mapped_model;
        }
      } else {
        // 使用前缀缓存亲和性查找渠道
        provider = this.findProviderByModelPrefix(model);

        if (!provider) {
          // 尝试获取默认渠道
          const providers = this.getActiveProviders();
          if (providers.length === 0) {
            return res.status(404).json({ error: 'No active providers found' });
          }
          provider = providers[0];
        }

        apiKey = provider.api_key;
        baseUrl = provider.base_url;
        mappedModel = provider.mapped_model || model;

        // 如果没有 api_key，使用轮询选择
        if (!apiKey) {
          const keys = this.getProviderKeys(provider.id);
          const selectedKey = this.selectKeyByWeight(keys);
          if (!selectedKey) {
            return res.status(500).json({ error: 'No available API keys' });
          }
          apiKey = selectedKey.api_key;
        }
      }

      if (!apiKey) {
        return res.status(500).json({ error: 'No API key available' });
      }

      // 构建目标 URL
      const targetUrl = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;

      // 准备请求体
      const requestBody = {
        ...req.body,
        model: mappedModel
      };

      // 如果是流式请求
      if (stream) {
        return this.handleStreamRequest(req, res, targetUrl, apiKey, provider.id, requestBody);
      }

      // 非流式请求
      const response = await this.makeRequest(targetUrl, apiKey, requestBody);

      // 更新统计
      const tokens = response.usage ? response.usage.total_tokens || 0 : 0;
      this.updateStats(provider.id, tokens);

      // 替换模型名称返回
      response.model = model;
      return res.json(response);

    } catch (error) {
      console.error('Chat completion error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // 处理流式请求
  async handleStreamRequest(req, res, targetUrl, apiKey, providerId, requestBody) {
    try {
      const { fetch } = await import('undici');
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
        dispatcher: new (await import('undici')).Agent({ 
          connect: { timeout: 60000 }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        return res.status(response.status).json({ error: error || 'Request failed' });
      }

      // 设置流式响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      let totalTokens = 0;
      let isFirstChunk = true;

      // 处理流式响应
      for await (const chunk of response.body) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              res.write('data: [DONE]\n\n');
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              
              // 计算 token
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                // 粗略估算：每个中文字符约 2 tokens，英文约 0.75 tokens
                const content = parsed.choices[0].delta.content;
                const charCount = content.length;
                const estimatedTokens = Math.ceil(charCount * (content.match(/[\u4e00-\u9fff]/) ? 0.5 : 0.75));
                totalTokens += estimatedTokens;
              }

              // 流式传输时修改 model 名称
              if (isFirstChunk && parsed.model) {
                parsed.model = requestBody.model;
                isFirstChunk = false;
              }

              res.write(`data: ${JSON.stringify(parsed)}\n\n`);
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      // 更新统计
      this.updateStats(providerId, totalTokens);

      res.end();

    } catch (error) {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
      res.end();
    }
  }

  // 发送 HTTP 请求
  async makeRequest(url, apiKey, body) {
    const { fetch } = await import('undici');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body),
      dispatcher: new (await import('undici')).Agent({ 
        connect: { timeout: 60000 }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // 获取模型列表
  async handleModels(req, res) {
    try {
      this.initTables();

      const providerHeader = req.headers['x-all-api-provider'];

      if (providerHeader) {
        const p = this.db.prepare(`
          SELECT p.*,
            (SELECT api_key FROM provider_keys WHERE provider_id = p.id AND status = 'active' LIMIT 1) as api_key
          FROM providers p WHERE p.name = ? OR p.id = ?
        `).get(providerHeader, providerHeader);

        if (!p) {
          return res.status(404).json({ error: 'Provider not found' });
        }

        // 从目标渠道获取模型列表
        const targetUrl = `${p.base_url.replace(/\/$/, '')}/v1/models`;
        const { fetch } = await import('undici');
        
        const response = await fetch(targetUrl, {
          headers: {
            'Authorization': `Bearer ${p.api_key}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          return res.json(data);
        }
      }

      // 返回所有映射的模型
      const mappings = this.db.prepare(`
        SELECT DISTINCT mm.model_name as id, mm.model_name as name, p.name as provider
        FROM model_mappings mm
        JOIN providers p ON mm.provider_id = p.id
        WHERE p.status = 'active'
      `).all();

      return res.json({
        object: 'list',
        data: mappings
      });

    } catch (error) {
      console.error('Models error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // 清除前缀缓存
  clearPrefixCache() {
    prefixCache.clear();
  }

  // 清除特定模型的缓存
  clearModelCache(model) {
    prefixCache.delete(model);
  }
}

export default new ProxyService();