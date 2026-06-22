# AllApi 规格说明书

## Why

个人使用的 AI API 聚合服务，需要将不同 AI 服务商（OpenAI、Anthropic、Google Gemini、Claude 等）的接口统一为一个 OpenAI 格式的代理服务，方便管理和使用。

## What Changes

- 构建一个 Node.js 后端服务，接收 OpenAI 格式请求并转发到不同的 AI 提供商
- 构建一个现代化前端界面，使用 Vite + React 或 Vue
- 支持用户自定义渠道（Provider），配置名称、API Keys（多个）、Base URL
- 内置常用 AI 渠道，提供预配置的 Base URL 和名称，用户只需填写 Key 和模型
- 支持模型重写功能，用户请求的模型名可映射到上游实际模型
- 集中管理模型信息（价格、图标等）
- 支持轮询和权重机制分配请求到同一渠道的不同 Key
- 支持通过请求头 `X-ALL-API-PROVIDER: {PROVIDER-ID}` 强制指定渠道
- 渠道亲和性通过前缀缓存提高命中率
- 使用 LobeHub Icons 图标库显示渠道和模型 logo

## Impact

- 新增系统：AllApi API 聚合代理服务
- 前端：Vite + React/Vue 单页应用
- 后端：Node.js API 服务
- 数据库：用于存储渠道配置、模型配置等（建议 SQLite 或 PostgreSQL）

---

## ADDED Requirements

### Requirement: 渠道管理

系统 SHALL 提供渠道（Provider）管理功能，包括：
- 创建、编辑、删除渠道
- 支持三种 API 格式：OpenAI Chat 兼容、Claude 兼容（Anthropic）、Gemini 兼容（Google）
- 配置渠道名称、Base URL、API Keys（支持多个 key）
- 为每个 Key 设置权重（默认 1）
- 为渠道设置启用/禁用状态
- 渠道 ID 用于标识和请求头匹配

#### Scenario: 创建自定义渠道

- **WHEN** 用户创建新渠道，选择"OpenAI Chat 兼容"格式
- **AND** 填写名称为"My API"，Base URL 为"https://api.example.com/v1"
- **AND** 添加两个 API Keys 和权重
- **THEN** 系统保存渠道配置
- **AND** 返回渠道 ID

#### Scenario: 强制指定渠道

- **WHEN** 请求头包含 `X-ALL-API-PROVIDER: my-custom-provider`
- **THEN** 系统将请求路由到 ID 为 `my-custom-provider` 的渠道
- **AND** 忽略模型匹配和轮询逻辑

---

### Requirement: 内置渠道

系统 SHALL 提供以下内置渠道预配置：

| 渠道名称 | 格式 | Base URL | 预置模型 |
|---------|------|----------|---------|
| OpenAI | OpenAI Chat | https://api.openai.com/v1 | gpt-4, gpt-4-turbo, gpt-4o, gpt-4o-mini, gpt-3.5-turbo |
| Anthropic | Claude | https://api.anthropic.com/v1 | claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus, claude-3-sonnet |
| Google Gemini | Gemini | https://generativelanguage.googleapis.com/v1beta | gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash |
| DeepSeek | OpenAI Chat | https://api.deepseek.com | deepseek-chat, deepseek-coder |
| Groq | OpenAI Chat | https://api.groq.com/openai/v1 | llama-3.3-70b-versatile, mixtral-8x7b-32768 |
| Together AI | OpenAI Chat | https://api.together.ai/v1 | meta-llama/Llama-3.3-70B-Instruct-Turbo |
| OpenRouter | OpenAI Chat | https://openrouter.ai/api/v1 | 多种模型（动态） |
| Fireworks AI | OpenAI Chat | https://api.fireworks.ai/inference/v1 | llama-v3-70b-instruct |
| Mistral AI | OpenAI Chat | https://api.mistral.ai/v1 | mistral-large, mistral-small, mistral-medium |
| Hugging Face | OpenAI Chat | https://api-inference.huggingface.co.co/v1 | 动态 |
| Cohere | OpenAI Chat | https://api.cohere.ai/v1 | command-r-plus, command-r |
| Perplexity | OpenAI Chat | https://api.perplexity.ai | llama-3.1-sonar-small, llama-3.1-sonar-large |
| zhipu (智谱) | OpenAI Chat | https://open.bigmodel.cn/api/paas/v4 | glm-4, glm-4-flash, glm-4v |
| moonshot (月之暗面/Kimi) | OpenAI Chat | https://api.moonshot.cn/v1 | moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k |
| minimax | OpenAI Chat | https://api.minimax.chat/v1 | abab6-chat, abab5.5-chat |
| 01ai (零一万物) | OpenAI Chat | https://api.01.ai/v1 | yi-large, yi-medium, yi-small |
| Baidu (百度文心) | ERNIE | https://qianfan.baidubce.com/v2 | ernie-4.0-8k, ernie-3.5-8k |
| Tencent (腾讯混元) | OpenAI Chat | https://hunyuan.cloud.tencent.com/v1 | hunyuan-latest |
| Alibaba (通义千问) | OpenAI Chat | https://dashscope.aliyuncs.com/compatible-mode/v1 | qwen-long, qwen-max, qwen-plus, qwen-turbo |
| Stability AI | OpenAI Chat | https://api.stability.ai/v1 | stable-diffusion-xl-1024-v1-0 |
| AI21 (Jamba) | OpenAI Chat | https://api.ai21.com/v1 | jamba-1.5-large, jamba-1.5-mini |
| Cloudflare Workers AI | OpenAI Chat | https://gateway.ai.cloudflare.com/v1/account/{account}/workers-ai | @cf/meta/llama-3-70b-instruct |
| Le Chat (Mistral) | OpenAI Chat | https://chat.mistral.ai/v1 | mistral-large-latest, mistral-small-latest |

---

### Requirement: 模型重写

系统 SHALL 提供模型重写（Mapping）功能：

- 每个渠道可配置多个模型映射规则
- 映射规则：用户请求的模型名 → 上游实际模型名
- 示例：deepseek-chat → deepseek-v3

#### Scenario: 模型重写配置

- **WHEN** 用户在渠道配置中设置映射规则：deepseek-chat → deepseek-v3
- **AND** 用户请求模型为 deepseek-chat
- **THEN** 实际转发请求使用模型 deepseek-v3

---

### Requirement: 模型管理

系统 SHALL 提供全局模型管理功能：

- 管理用户请求的模型（重写后的模型）
- 设置模型价格（输入/输出 token 价格）
- 设置模型图标（支持 LobeHub Icons 自动匹配或自定义 URL）
- 模型列表用于统计页面展示

#### Scenario: 配置模型价格

- **WHEN** 用户在模型管理中设置 gpt-4o 价格：输入 $0.005/1K tokens，输出 $0.015/1K tokens
- **THEN** 统计页面可按模型查看消费

---

### Requirement: 请求路由与负载均衡

系统 SHALL 提供智能请求路由：

- 根据请求的模型自动匹配对应渠道
- 匹配规则：请求模型 → 渠道的模型映射 → 上游模型
- 同一渠道多个 Key 时，根据权重轮询分配请求
- 支持前缀缓存：相同前缀的请求（模型名、用户 ID 等）路由到相同渠道

#### Scenario: 轮询分配

- **WHEN** 渠道有两个 Key，权重分别为 3 和 1
- **THEN** 每 4 个请求中，3 个使用 Key1，1 个使用 Key2

---

### Requirement: 图标系统

系统 SHALL 使用 LobeHub Icons 作为默认图标来源：

- 渠道图标：根据渠道名称自动匹配 LobeHub Icons
  - URL 格式：`https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/{icon-name}.png`
  - 图标名称：渠道名的简短形式（如 openai, anthropic, google, deepseek）
- 模型图标：根据模型名称自动匹配 LobeHub Icons
  - 支持用户自定义图标 URL 覆盖默认
- 图标主题：默认使用深色主题

#### Scenario: 图标自动匹配

- **WHEN** 用户创建渠道名称为"DeepSeek"
- **THEN** 系统自动设置图标 URL 为 `https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/deepseek.png`
- **AND** 如果匹配失败，使用默认占位图标

---

### Requirement: API 转发

系统 SHALL 支持 OpenAI 格式的 `/v1/chat/completions` 等核心接口：

- 接收 OpenAI 格式的请求体
- 根据模型名路由到对应渠道
- 转换请求格式以适配上游提供商
- 返回上游响应（尽可能保持原始格式）
- 支持流式响应（Server-Sent Events）

#### Scenario: 转发请求

- **WHEN** POST /v1/chat/completions 请求体包含 model: "gpt-4o"
- **THEN** 系统匹配到 OpenAI 渠道
- **AND** 使用轮询选中的 Key 转发到 https://api.openai.com/v1/chat/completions
- **AND** 返回 OpenAI 格式的响应

---

## MODIFIED Requirements

无

---

## REMOVED Requirements

无

---

## 技术栈

### 前端
- Vite + React 或 Vue（现代化 UI）
- LobeHub Icons 图标库
- 响应式设计，现代感界面

### 后端
- Node.js (推荐 Express.js 或 Fastify)
- 数据库：SQLite（轻量）或 PostgreSQL（生产环境）
- 支持反向代理到多个 AI 提供商

### 数据模型

#### Provider (渠道)
```typescript
interface Provider {
  id: string;              // 唯一标识符
  name: string;            // 显示名称
  format: 'openai' | 'anthropic' | 'gemini';  // API 格式
  baseUrl: string;         // 上游 Base URL
  keys: ProviderKey[];      // API Keys
  models: ModelMapping[];  // 模型映射
  enabled: boolean;         // 启用/禁用
  isBuiltIn: boolean;       // 是否内置
  iconUrl?: string;         // 自定义图标 URL
  createdAt: Date;
  updatedAt: Date;
}

interface ProviderKey {
  id: string;
  key: string;             // API Key (加密存储)
  weight: number;           // 权重，默认 1
  enabled: boolean;
}

interface ModelMapping {
  userModel: string;       // 用户请求的模型名
  upstreamModel: string;    // 上游实际模型名
}
```

#### Model (模型)
```typescript
interface Model {
  id: string;              // 模型标识 (对应 userModel)
  name: string;            // 显示名称
  iconUrl?: string;        // 自定义图标 URL
  priceInput?: number;     // 输入价格 (per 1K tokens)
  priceOutput?: number;     // 输出价格 (per 1K tokens)
  providerId?: string;     // 关联渠道 (可选)
  enabled: boolean;
}
```
