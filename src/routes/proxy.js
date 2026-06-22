import express from 'express';
import proxyService from '../services/proxyService.js';

const router = express.Router();

// POST /v1/chat/completions - 聊天完成
router.post('/v1/chat/completions', (req, res) => {
  proxyService.handleChatCompletion(req, res);
});

// GET /v1/models - 获取模型列表
router.get('/v1/models', (req, res) => {
  proxyService.handleModels(req, res);
});

export default router;