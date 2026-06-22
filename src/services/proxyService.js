import BaseService from './BaseService.js';
import db from '../models/database.js';
import { getProviders, getProviderKeys, getModelMappings } from '../models/database.js';

// 前缀缓存亲和性 - 基于 model 前缀的渠道匹配缓存
const prefixCache = new Map();
const PREFIX_CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

class ProxyService extends BaseService {
  constructor() {
    super();
    this.db = db;
  }

  // 获取所有启用渠道
  getActiveProviders() {
    return getProviders(1); // 1 = enabled
  }

  // 根据 model 查找对应渠道和映射
  findProviderByModel(model) {
    // 检查缓存
    const now = Date.now();
    if (prefixCache.has(model)) {
      const cached = prefixCache.get(model);
      if (now - cached.timestamp < PREFIX_CACHE_TTL) {
        return cached;
      }
      prefixCache.delete(model);
    }

    // 查找模型映射
    const mappings = getModelMappings();
    const providers = getProviders(1);

    // 建立 provider 映射
    const providerMap = new Map();
    for (const p of providers) {
      providerMap.set(p.id, p);
    }

    // 精确匹配
    for (const mapping of mappings) {
      if (mapping.user_model === model) {
        const provider = providerMap.get(mapping.provider_id);
        if (provider) {
          const result = { provider, mapping };
          prefixCache.set(model, { ...result, timestamp: now });
          return result;
        }
      }
    }

    // 前缀匹配 - 查找最长匹配的前缀
    let bestMatch = null;
    let bestPrefixLength = 0;

    for (const mapping of mappings) {
      if (model.startsWith(mapping.user_model) && mapping.user_model.length > bestPrefixLength) {
        const provider = providerMap.get(mapping.provider_id);
        if (provider) {
          bestMatch = { provider, mapping };
          bestPrefixLength = mapping.user_model.length;
        }
      }
    }

    if (bestMatch) {
      prefixCache.set(model, { ...bestMatch, timestamp: now });
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

  // 处理聊天完成请求
  async handleChatCompletion(req, res) {
    try {
      const { model, stream } = req.body;
      const providerHeader = req.headers['x-all-api-provider'];

      let provider;
      let mappedModel = model;

      // 优先使用 Header 指定的渠道
      if (providerHeader) {
        const providers = getProviders(1);
        provider = providers.find(p => p.name === providerHeader || String(p.id) === String(providerHeader));

        if (!provider) {
          return res.status(404).json({ error: 'Provider not found or not enabled' });
        }

        // 查找该渠道的模型映射
        const mappings = getModelMappings(provider.id);
        const mapping = mappings.find(m => m.user_model === model);
        if (mapping) {
          mappedModel = mapping.upstream_model;
        }
      } else {
        // 使用前缀缓存亲和性查找渠道
        const match = this.findProviderByModel(model);

        if (!match) {
          const providers = getProviders(1);
          if (providers.length === 0) {
            return res.status(404).json({ error: 'No active providers found' });
          }
          provider = providers[0];
        } else {
          provider = match.provider;
          mappedModel = match.mapping.upstream_model || model;
        }
      }

      // 获取渠道的 Keys
      const keys = getProviderKeys(provider.id).filter(k => k.enabled === 1);
      if (keys.length === 0) {
        return res.status(500).json({ error: 'No available API keys for this provider' });
      }

      // 轮询选择 Key
      const selectedKey = this.selectKeyByWeight(keys);
      if (!selectedKey) {
        return res.status(500).json({ error: 'Failed to select API key' });
      }

      // 构建目标 URL
      const targetUrl = `${provider.base_url.replace(/\/$/, '')}/chat/completions`;

      // 准备请求体
      const requestBody = {
        ...req.body,
        model: mappedModel
      };

      // 如果是流式请求
      if (stream) {
        return this.handleStreamRequest(req, res, targetUrl, selectedKey.key, provider.id, requestBody, model);
      }

      // 非流式请求
      const response = await this.makeRequest(targetUrl, selectedKey.key, requestBody);

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
  async handleStreamRequest(req, res, targetUrl, apiKey, providerId, requestBody, originalModel) {
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
                const content = parsed.choices[0].delta.content;
                const charCount = content.length;
                const estimatedTokens = Math.ceil(charCount * (content.match(/[\u4e00-\u9fff]/) ? 0.5 : 0.75));
                totalTokens += estimatedTokens;
              }

              // 流式传输时修改 model 名称
              if (isFirstChunk && parsed.model) {
                parsed.model = originalModel;
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

  // 更新统计
  updateStats(providerId, tokens = 0, cost = 0) {
    try {
      this.db.prepare(`
        INSERT INTO usage_logs (provider_id, model, input_tokens, output_tokens, cost)
        VALUES (?, 'unknown', ?, 0, ?)
      `).run(providerId, tokens, cost);
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  // 获取模型列表
  async handleModels(req, res) {
    try {
      const providerHeader = req.headers['x-all-api-provider'];

      if (providerHeader) {
        const providers = getProviders(1);
        const provider = providers.find(p => p.name === providerHeader || String(p.id) === String(providerHeader));

        if (!provider) {
          return res.status(404).json({ error: 'Provider not found' });
        }

        // 从目标渠道获取模型列表
        const targetUrl = `${provider.base_url.replace(/\/$/, '')}/models`;
        const { fetch } = await import('undici');

        const response = await fetch(targetUrl, {
          headers: {
            'Authorization': `Bearer ${provider.api_key}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          return res.json(data);
        }
      }

      // 返回所有映射的模型
      const mappings = getModelMappings();
      const providers = getProviders(1);

      const providerMap = new Map();
      for (const p of providers) {
        providerMap.set(p.id, p);
      }

      const models = [];
      for (const m of mappings) {
        const provider = providerMap.get(m.provider_id);
        if (provider) {
          models.push({
            id: m.user_model,
            name: m.user_model,
            provider: provider.name
          });
        }
      }

      return res.json({
        object: 'list',
        data: models
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
