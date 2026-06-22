import express from 'express';
import providerController from '../controllers/providerController.js';
import proxyRoutes from './proxy.js';

const router = express.Router();

// API 路由 - 路径不应包含 /api 前缀，因为 app.use('/api', routes) 已添加
// GET /providers - 获取所有渠道
router.get('/providers', (req, res) => providerController.getProviders(req, res));

// POST /providers - 创建渠道
router.post('/providers', (req, res) => providerController.createProvider(req, res));

// GET /providers/:id - 获取单个渠道
router.get('/providers/:id', (req, res) => providerController.getProvider(req, res));

// PUT /providers/:id - 更新渠道
router.put('/providers/:id', (req, res) => providerController.updateProvider(req, res));

// DELETE /providers/:id - 删除渠道
router.delete('/providers/:id', (req, res) => providerController.deleteProvider(req, res));

// POST /providers/:id/keys - 添加 Key
router.post('/providers/:id/keys', (req, res) => providerController.addKey(req, res));

// PUT /providers/:id/keys/:keyId - 更新 Key
router.put('/providers/:id/keys/:keyId', (req, res) => providerController.updateKey(req, res));

// DELETE /providers/:id/keys/:keyId - 删除 Key
router.delete('/providers/:id/keys/:keyId', (req, res) => providerController.deleteKey(req, res));

// POST /providers/:id/models - 添加模型映射
router.post('/providers/:id/models', (req, res) => providerController.addModelMapping(req, res));

// GET /models - 获取所有模型映射
router.get('/models', (req, res) => providerController.getModels(req, res));

// POST /models - 创建模型映射
router.post('/models', (req, res) => providerController.createModel(req, res));

// GET /stats - 统计信息
router.get('/stats', (req, res) => providerController.getStats(req, res));

// 代理路由 - 只匹配 /v1 前缀
router.use('/v1', proxyRoutes);

export default router;