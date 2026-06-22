import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || './database/allapi.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Encryption helpers
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Create tables
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      format TEXT NOT NULL,
      base_url TEXT,
      enabled INTEGER DEFAULT 1,
      is_built_in INTEGER DEFAULT 0,
      icon_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS provider_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      weight INTEGER DEFAULT 1,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS model_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      user_model TEXT NOT NULL,
      upstream_model TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon_url TEXT,
      price_input REAL,
      price_output REAL,
      provider_id INTEGER NOT NULL,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      model TEXT NOT NULL,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      cost REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
    );
  `);
}

// Seed data for built-in providers
const BUILT_IN_PROVIDERS = [
  { name: 'OpenAI', format: 'openai', base_url: 'https://api.openai.com/v1', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/openai.png' },
  { name: 'Anthropic', format: 'anthropic', base_url: 'https://api.anthropic.com', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/anthropic.png' },
  { name: 'Google Gemini', format: 'google', base_url: 'https://generativelanguage.googleapis.com/v1beta', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/google.png' },
  { name: 'DeepSeek', format: 'deepseek', base_url: 'https://api.deepseek.com/v1', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/deepseek.png' },
  { name: 'Groq', format: 'groq', base_url: 'https://api.groq.com/openai/v1', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/groq.png' },
  { name: 'Together AI', format: 'togetherai', base_url: 'https://api.together.xyz/v1', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/togetherai.png' },
  { name: 'OpenRouter', format: 'openrouter', base_url: 'https://openrouter.ai/api/v1', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/openrouter.png' },
  { name: 'Fireworks AI', format: 'fireworksai', base_url: 'https://api.fireworks.ai/inference/v1', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/fireworksai.png' },
  { name: 'Mistral AI', format: 'mistralai', base_url: 'https://api.mistral.ai/v1', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/mistralai.png' },
  { name: 'Hugging Face', format: 'huggingface', base_url: 'https://api-inference.huggingface.co/v1', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/huggingface.png' },
  { name: 'Cohere', format: 'cohere', base_url: 'https://api.cohere.ai/v1', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/cohere.png' },
  { name: 'Perplexity', format: 'perplexity', base_url: 'https://api.perplexity.ai', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/perplexity.png' },
  { name: '智谱 zhipu', format: 'zhipu', base_url: 'https://open.bigmodel.cn/api/paas/v4', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/zhipu.png' },
  { name: '月之暗面 moonshot', format: 'moonshot', base_url: 'https://api.moonshot.cn/v1', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/moonshot.png' },
  { name: 'MiniMax', format: 'minimax', base_url: 'https://api.minimax.chat/v1', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/minimax.png' },
  { name: '零一万物 01ai', format: 'zeroone', base_url: 'https://api.01.ai/v1', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/zeroone.png' },
  { name: '百度 Baidu', format: 'baidu', base_url: 'https://qianfan.baidubce.com/v2', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/baidu.png' },
  { name: '腾讯混元 Tencent', format: 'tencent', base_url: 'https://hunyuan.cloud.tencent.com/v1', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/tencent.png' },
  { name: '通义千问 Alibaba', format: 'alibaba', base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/alibaba.png' },
  { name: 'Stability AI', format: 'stability', base_url: 'https://api.stability.ai/v1', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/stability.png' },
  { name: 'AI21 Jamba', format: 'ai21', base_url: 'https://api.ai21.com/v1', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/ai21.png' },
  { name: 'Cloudflare Workers AI', format: 'cloudflare', base_url: 'https://api.cloudflare.com/client/v4/ai', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/cloudflare.png' },
  { name: 'Le Chat Mistral', format: 'lechatt', base_url: 'https://chat.mistral.ai/v1', icon_url: 'https://cdn.jsdelivr.net/gh/nicepkg/all-api@main/frontend/assets/icons/lechatt.png' }
];

function seedBuiltInProviders() {
  const insertProvider = db.prepare(`
    INSERT OR IGNORE INTO providers (name, format, base_url, enabled, is_built_in, icon_url)
    VALUES (?, ?, ?, 1, 1, ?)
  `);

  for (const provider of BUILT_IN_PROVIDERS) {
    insertProvider.run(provider.name, provider.format, provider.base_url, provider.icon_url);
  }
}

// Provider CRUD
export function createProvider({ name, format, base_url, enabled = 1, is_built_in = 0, icon_url }) {
  const stmt = db.prepare(`
    INSERT INTO providers (name, format, base_url, enabled, is_built_in, icon_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(name, format, base_url, enabled, is_built_in, icon_url);
  return result.lastInsertRowid;
}

export function getProvider(id) {
  const stmt = db.prepare('SELECT * FROM providers WHERE id = ?');
  return stmt.get(id);
}

export function getProviders(enabled = null) {
  if (enabled !== null) {
    const stmt = db.prepare('SELECT * FROM providers WHERE enabled = ?');
    return stmt.all(enabled);
  }
  const stmt = db.prepare('SELECT * FROM providers');
  return stmt.all();
}

export function updateProvider(id, { name, format, base_url, enabled, icon_url }) {
  const updates = [];
  const values = [];
  
  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (format !== undefined) { updates.push('format = ?'); values.push(format); }
  if (base_url !== undefined) { updates.push('base_url = ?'); values.push(base_url); }
  if (enabled !== undefined) { updates.push('enabled = ?'); values.push(enabled); }
  if (icon_url !== undefined) { updates.push('icon_url = ?'); values.push(icon_url); }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`UPDATE providers SET ${updates.join(', ')} WHERE id = ?`);
  return stmt.run(...values);
}

export function deleteProvider(id) {
  const stmt = db.prepare('DELETE FROM providers WHERE id = ?');
  return stmt.run(id);
}

// Provider Key CRUD
export function createProviderKey({ provider_id, key, weight = 1, enabled = 1 }) {
  const encryptedKey = encrypt(key);
  const stmt = db.prepare(`
    INSERT INTO provider_keys (provider_id, key, weight, enabled)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(provider_id, encryptedKey, weight, enabled);
  return result.lastInsertRowid;
}

export function getProviderKeys(providerId = null) {
  let stmt;
  if (providerId !== null) {
    stmt = db.prepare('SELECT * FROM provider_keys WHERE provider_id = ?');
    const keys = stmt.all(providerId);
    return keys.map(k => ({ ...k, key: decrypt(k.key) }));
  }
  stmt = db.prepare('SELECT * FROM provider_keys');
  const keys = stmt.all();
  return keys.map(k => ({ ...k, key: decrypt(k.key) }));
}

export function updateProviderKey(id, { key, weight, enabled }) {
  const updates = [];
  const values = [];
  
  if (key !== undefined) { updates.push('key = ?'); values.push(encrypt(key)); }
  if (weight !== undefined) { updates.push('weight = ?'); values.push(weight); }
  if (enabled !== undefined) { updates.push('enabled = ?'); values.push(enabled); }
  
  values.push(id);
  
  const stmt = db.prepare(`UPDATE provider_keys SET ${updates.join(', ')} WHERE id = ?`);
  return stmt.run(...values);
}

export function deleteProviderKey(id) {
  const stmt = db.prepare('DELETE FROM provider_keys WHERE id = ?');
  return stmt.run(id);
}

// Model Mapping CRUD
export function createModelMapping({ provider_id, user_model, upstream_model }) {
  const stmt = db.prepare(`
    INSERT INTO model_mappings (provider_id, user_model, upstream_model)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(provider_id, user_model, upstream_model);
  return result.lastInsertRowid;
}

export function getModelMappings(providerId = null) {
  let stmt;
  if (providerId !== null) {
    stmt = db.prepare('SELECT * FROM model_mappings WHERE provider_id = ?');
    return stmt.all(providerId);
  }
  stmt = db.prepare('SELECT * FROM model_mappings');
  return stmt.all();
}

export function deleteModelMapping(id) {
  const stmt = db.prepare('DELETE FROM model_mappings WHERE id = ?');
  return stmt.run(id);
}

// Model CRUD
export function createModel({ name, icon_url, price_input, price_output, provider_id, enabled = 1 }) {
  const stmt = db.prepare(`
    INSERT INTO models (name, icon_url, price_input, price_output, provider_id, enabled)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(name, icon_url, price_input, price_output, provider_id, enabled);
  return result.lastInsertRowid;
}

export function getModels(providerId = null, enabled = null) {
  let sql = 'SELECT * FROM models WHERE 1=1';
  const params = [];
  
  if (providerId !== null) {
    sql += ' AND provider_id = ?';
    params.push(providerId);
  }
  if (enabled !== null) {
    sql += ' AND enabled = ?';
    params.push(enabled);
  }
  
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

export function updateModel(id, { name, icon_url, price_input, price_output, enabled }) {
  const updates = [];
  const values = [];
  
  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (icon_url !== undefined) { updates.push('icon_url = ?'); values.push(icon_url); }
  if (price_input !== undefined) { updates.push('price_input = ?'); values.push(price_input); }
  if (price_output !== undefined) { updates.push('price_output = ?'); values.push(price_output); }
  if (enabled !== undefined) { updates.push('enabled = ?'); values.push(enabled); }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`UPDATE models SET ${updates.join(', ')} WHERE id = ?`);
  return stmt.run(...values);
}

export function deleteModel(id) {
  const stmt = db.prepare('DELETE FROM models WHERE id = ?');
  return stmt.run(id);
}

// Usage Log CRUD
export function createUsageLog({ provider_id, model, input_tokens = 0, output_tokens = 0, cost = 0 }) {
  const stmt = db.prepare(`
    INSERT INTO usage_logs (provider_id, model, input_tokens, output_tokens, cost)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(provider_id, model, input_tokens, output_tokens, cost);
  return result.lastInsertRowid;
}

export function getUsageStats(providerId = null, startDate = null, endDate = null) {
  let sql = `
    SELECT 
      provider_id,
      model,
      SUM(input_tokens) as total_input_tokens,
      SUM(output_tokens) as total_output_tokens,
      SUM(cost) as total_cost,
      COUNT(*) as request_count
    FROM usage_logs
    WHERE 1=1
  `;
  const params = [];
  
  if (providerId !== null) {
    sql += ' AND provider_id = ?';
    params.push(providerId);
  }
  if (startDate) {
    sql += ' AND created_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND created_at <= ?';
    params.push(endDate);
  }
  
  sql += ' GROUP BY provider_id, model';
  
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

// Initialize on load
initializeDatabase();
seedBuiltInProviders();

export default db;
