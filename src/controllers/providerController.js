import BaseController from './BaseController.js';
import db from '../models/database.js';

class ProviderController extends BaseController {
  constructor() {
    super();
  }

  // 初始化数据库表
  initTables() {
    db.exec(`
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

      CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider_id INTEGER NOT NULL,
        date DATE DEFAULT (date('now')),
        request_count INTEGER DEFAULT 0,
        token_count INTEGER DEFAULT 0,
        cost REAL DEFAULT 0,
        FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
        UNIQUE(provider_id, date)
      );
    `);
  }

  // GET /api/providers - 获取所有渠道
  async getProviders(req, res) {
    try {
      this.initTables();
      const providers = db.prepare(`
        SELECT p.*, 
          (SELECT COUNT(*) FROM provider_keys WHERE provider_id = p.id) as key_count,
          (SELECT COUNT(*) FROM model_mappings WHERE provider_id = p.id) as model_count
        FROM providers p
        ORDER BY p.created_at DESC
      `).all();
      this.success(res, providers);
    } catch (error) {
      this.error(res, error.message);
    }
  }

  // POST /api/providers - 创建渠道
  async createProvider(req, res) {
    try {
      this.initTables();
      const { name, base_url, api_type = 'openai' } = req.body;
      
      if (!name || !base_url) {
        return this.error(res, 'name and base_url are required', 400);
      }

      const result = db.prepare(`
        INSERT INTO providers (name, base_url, api_type) VALUES (?, ?, ?)
      `).run(name, base_url, api_type);

      const provider = db.prepare('SELECT * FROM providers WHERE id = ?').get(result.lastInsertRowid);
      this.success(res, provider, 'Provider created');
    } catch (error) {
      if (error.message.includes('UNIQUE constraint')) {
        return this.error(res, 'Provider name already exists', 400);
      }
      this.error(res, error.message);
    }
  }

  // GET /api/providers/:id - 获取单个渠道
  async getProvider(req, res) {
    try {
      this.initTables();
      const { id } = req.params;
      const provider = db.prepare(`
        SELECT p.*,
          (SELECT COUNT(*) FROM provider_keys WHERE provider_id = p.id) as key_count,
          (SELECT COUNT(*) FROM model_mappings WHERE provider_id = p.id) as model_count
        FROM providers p WHERE p.id = ?
      `).get(id);

      if (!provider) {
        return this.error(res, 'Provider not found', 404);
      }

      const keys = db.prepare('SELECT * FROM provider_keys WHERE provider_id = ?').all(id);
      const models = db.prepare('SELECT * FROM model_mappings WHERE provider_id = ?').all(id);

      this.success(res, { ...provider, keys, models });
    } catch (error) {
      this.error(res, error.message);
    }
  }

  // PUT /api/providers/:id - 更新渠道
  async updateProvider(req, res) {
    try {
      this.initTables();
      const { id } = req.params;
      const { name, base_url, api_type, status } = req.body;

      const provider = db.prepare('SELECT * FROM providers WHERE id = ?').get(id);
      if (!provider) {
        return this.error(res, 'Provider not found', 404);
      }

      db.prepare(`
        UPDATE providers 
        SET name = COALESCE(?, name),
            base_url = COALESCE(?, base_url),
            api_type = COALESCE(?, api_type),
            status = COALESCE(?, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, base_url, api_type, status, id);

      const updated = db.prepare('SELECT * FROM providers WHERE id = ?').get(id);
      this.success(res, updated, 'Provider updated');
    } catch (error) {
      this.error(res, error.message);
    }
  }

  // DELETE /api/providers/:id - 删除渠道
  async deleteProvider(req, res) {
    try {
      this.initTables();
      const { id } = req.params;

      const provider = db.prepare('SELECT * FROM providers WHERE id = ?').get(id);
      if (!provider) {
        return this.error(res, 'Provider not found', 404);
      }

      db.prepare('DELETE FROM providers WHERE id = ?').run(id);
      this.success(res, null, 'Provider deleted');
    } catch (error) {
      this.error(res, error.message);
    }
  }

  // POST /api/providers/:id/keys - 添加 Key
  async addKey(req, res) {
    try {
      this.initTables();
      const { id } = req.params;
      const { api_key, weight = 1 } = req.body;

      if (!api_key) {
        return this.error(res, 'api_key is required', 400);
      }

      const provider = db.prepare('SELECT * FROM providers WHERE id = ?').get(id);
      if (!provider) {
        return this.error(res, 'Provider not found', 404);
      }

      const result = db.prepare(`
        INSERT INTO provider_keys (provider_id, api_key, weight) VALUES (?, ?, ?)
      `).run(id, api_key, weight);

      const key = db.prepare('SELECT * FROM provider_keys WHERE id = ?').get(result.lastInsertRowid);
      this.success(res, key, 'Key added');
    } catch (error) {
      this.error(res, error.message);
    }
  }

  // PUT /api/providers/:id/keys/:keyId - 更新 Key
  async updateKey(req, res) {
    try {
      this.initTables();
      const { id, keyId } = req.params;
      const { api_key, weight, status } = req.body;

      const key = db.prepare('SELECT * FROM provider_keys WHERE id = ? AND provider_id = ?').get(keyId, id);
      if (!key) {
        return this.error(res, 'Key not found', 404);
      }

      db.prepare(`
        UPDATE provider_keys 
        SET api_key = COALESCE(?, api_key),
            weight = COALESCE(?, weight),
            status = COALESCE(?, status)
        WHERE id = ?
      `).run(api_key, weight, status, keyId);

      const updated = db.prepare('SELECT * FROM provider_keys WHERE id = ?').get(keyId);
      this.success(res, updated, 'Key updated');
    } catch (error) {
      this.error(res, error.message);
    }
  }

  // DELETE /api/providers/:id/keys/:keyId - 删除 Key
  async deleteKey(req, res) {
    try {
      this.initTables();
      const { id, keyId } = req.params;

      const key = db.prepare('SELECT * FROM provider_keys WHERE id = ? AND provider_id = ?').get(keyId, id);
      if (!key) {
        return this.error(res, 'Key not found', 404);
      }

      db.prepare('DELETE FROM provider_keys WHERE id = ?').run(keyId);
      this.success(res, null, 'Key deleted');
    } catch (error) {
      this.error(res, error.message);
    }
  }

  // POST /api/providers/:id/models - 添加模型映射
  async addModelMapping(req, res) {
    try {
      this.initTables();
      const { id } = req.params;
      const { model_name, mapped_model } = req.body;

      if (!model_name || !mapped_model) {
        return this.error(res, 'model_name and mapped_model are required', 400);
      }

      const provider = db.prepare('SELECT * FROM providers WHERE id = ?').get(id);
      if (!provider) {
        return this.error(res, 'Provider not found', 404);
      }

      const result = db.prepare(`
        INSERT INTO model_mappings (provider_id, model_name, mapped_model) VALUES (?, ?, ?)
      `).run(id, model_name, mapped_model);

      const mapping = db.prepare('SELECT * FROM model_mappings WHERE id = ?').get(result.lastInsertRowid);
      this.success(res, mapping, 'Model mapping added');
    } catch (error) {
      if (error.message.includes('UNIQUE constraint')) {
        return this.error(res, 'Model mapping already exists', 400);
      }
      this.error(res, error.message);
    }
  }

  // GET /api/models - 获取所有模型映射
  async getModels(req, res) {
    try {
      this.initTables();
      const mappings = db.prepare(`
        SELECT m.*, p.name as provider_name, p.base_url
        FROM model_mappings m
        JOIN providers p ON m.provider_id = p.id
        ORDER BY m.created_at DESC
      `).all();
      this.success(res, mappings);
    } catch (error) {
      this.error(res, error.message);
    }
  }

  // POST /api/models - 创建模型映射
  async createModel(req, res) {
    try {
      this.initTables();
      const { provider_id, model_name, mapped_model } = req.body;

      if (!provider_id || !model_name || !mapped_model) {
        return this.error(res, 'provider_id, model_name and mapped_model are required', 400);
      }

      const provider = db.prepare('SELECT * FROM providers WHERE id = ?').get(provider_id);
      if (!provider) {
        return this.error(res, 'Provider not found', 404);
      }

      const result = db.prepare(`
        INSERT INTO model_mappings (provider_id, model_name, mapped_model) VALUES (?, ?, ?)
      `).run(provider_id, model_name, mapped_model);

      const mapping = db.prepare('SELECT * FROM model_mappings WHERE id = ?').get(result.lastInsertRowid);
      this.success(res, mapping, 'Model mapping created');
    } catch (error) {
      if (error.message.includes('UNIQUE constraint')) {
        return this.error(res, 'Model mapping already exists', 400);
      }
      this.error(res, error.message);
    }
  }

  // GET /api/stats - 统计信息
  async getStats(req, res) {
    try {
      this.initTables();

      const totalProviders = db.prepare('SELECT COUNT(*) as count FROM providers').get().count;
      const totalKeys = db.prepare('SELECT COUNT(*) as count FROM provider_keys WHERE status = "active"').get().count;
      const totalMappings = db.prepare('SELECT COUNT(*) as count FROM model_mappings').get().count;

      const dailyStats = db.prepare(`
        SELECT s.*, p.name as provider_name
        FROM stats s
        JOIN providers p ON s.provider_id = p.id
        WHERE s.date >= date('now', '-7 days')
        ORDER BY s.date DESC
      `).all();

      const todayStats = db.prepare(`
        SELECT SUM(request_count) as total_requests, SUM(token_count) as total_tokens
        FROM stats WHERE date = date('now')
      `).get();

      this.success(res, {
        totalProviders,
        totalKeys,
        totalMappings,
        dailyStats,
        todayStats: todayStats || { total_requests: 0, total_tokens: 0 }
      });
    } catch (error) {
      this.error(res, error.message);
    }
  }
}

export default new ProviderController();