# AllApi

AllApi 是一个统一的 AI API 管理平台，支持多渠道聚合、负载均衡、模型映射和用量统计。

## 功能特性

- **多渠道管理**: 支持 OpenAI、Anthropic、DeepSeek、智谱、月之暗面等 20+ AI 服务商
- **负载均衡**: 基于权重的智能请求分发，支持多 API Key 轮询
- **模型映射**: 自定义模型名称映射，统一对外暴露模型接口
- **用量统计**: 实时统计 Token 使用量和费用
- **安全加密**: API Key AES-256 加密存储

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React + Vite)                    │
│  ┌─────────┐  ┌───────────┐  ┌────────┐  ┌─────────────────┐ │
│  │Dashboard│  │Providers  │  │ Models │  │     Stats       │ │
│  └─────────┘  └───────────┘  └────────┘  └─────────────────┘ │
│                         React Query                          │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP /api
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     后端 (Express.js)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │Provider Ctrl │  │ Proxy Routes │  │   Stats Service   │   │
│  └──────────────┘  └──────────────┘  └───────────────────┘   │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Database Layer (SQLite + better-sqlite3) │   │
│  │  ┌──────────┐ ┌─────────────┐ ┌──────────┐ ┌───────┐ │   │
│  │  │providers │ │provider_keys│ │models    │ │usage  │ │   │
│  │  └──────────┘ └─────────────┘ └──────────┘ └───────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │ Proxy /v1
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    上游 AI 服务商 API                         │
│  OpenAI / Anthropic / DeepSeek / Gemini / ...                │
└─────────────────────────────────────────────────────────────┘
```

### 目录结构

```
/workspace
├── src/
│   ├── client/              # 前端源码
│   │   ├── api/             # 前端 API 请求封装
│   │   ├── components/      # React 组件
│   │   │   └── Layout.tsx   # 页面布局组件
│   │   ├── pages/           # 页面组件
│   │   │   ├── Dashboard.tsx    # 仪表盘
│   │   │   ├── Providers.tsx    # 渠道列表
│   │   │   ├── ProviderForm.tsx # 渠道编辑表单
│   │   │   ├── Models.tsx       # 模型管理
│   │   │   └── Stats.tsx        # 统计页面
│   │   ├── types/           # TypeScript 类型定义
│   │   ├── App.tsx          # React 应用入口
│   │   ├── main.tsx         # React 前端入口
│   │   └── index.css        # 全局样式
│   └── server/              # 后端源码
│       ├── api/             # API 路由封装
│       ├── config/          # 配置文件
│       ├── controllers/     # 控制器
│       ├── middleware/      # 中间件
│       ├── models/          # 数据模型层
│       │   └── database.js  # SQLite 数据库操作
│       ├── routes/          # 路由
│       │   ├── index.js     # API 路由
│       │   └── proxy.js     # 代理转发路由
│       ├── services/        # 业务服务层
│       ├── utils/           # 工具函数
│       └── index.js         # Express 后端入口
├── database/                 # SQLite 数据库文件目录
├── dist/                     # 生产构建产物
├── index.html                # HTML 入口
├── vite.config.ts            # Vite 配置
├── tailwind.config.js        # Tailwind CSS 配置
├── tsconfig.json             # TypeScript 配置
└── package.json              # 项目依赖
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 前端构建 | Vite 5 |
| UI 样式 | Tailwind CSS |
| 状态管理 | Zustand + React Query |
| 后端框架 | Express.js 5 |
| 数据库 | SQLite (better-sqlite3) |
| 加密 | AES-256-CBC |

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
# 配置代理（如需要）
export HTTP_PROXY=http://127.0.0.1:18080
export HTTPS_PROXY=http://127.0.0.1:18080

# 安装依赖
npm install
```

### 启动服务

**方式一：分别启动前后端**

```bash
# 启动后端 API 服务 (端口 3000)
node src/server/index.js

# 启动前端开发服务 (端口 5173)
npm run dev
```

**方式二：同时启动（推荐）**

```bash
# 后端
node src/server/index.js &

# 前端
npm run dev
```

访问 http://localhost:5173 即可使用。

### 构建生产版本

```bash
# 构建前端
npm run build

# 预览构建结果
npm run preview
```

## API 接口

### 渠道管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/providers` | 获取所有渠道 |
| POST | `/api/providers` | 创建渠道 |
| GET | `/api/providers/:id` | 获取单个渠道 |
| PUT | `/api/providers/:id` | 更新渠道 |
| DELETE | `/api/providers/:id` | 删除渠道 |
| POST | `/api/providers/:id/keys` | 添加 API Key |
| PUT | `/api/providers/:id/keys/:keyId` | 更新 API Key |
| DELETE | `/api/providers/:id/keys/:keyId` | 删除 API Key |
| POST | `/api/providers/:id/models` | 添加模型映射 |

### 模型管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/models` | 获取所有模型 |
| POST | `/api/models` | 创建模型 |

### 统计接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats` | 获取统计信息 |

### 代理接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/chat/completions` | Chat Completions 代理 |
| POST | `/api/v1/completions` | Completions 代理 |

## 配置说明

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 后端服务端口 | 3000 |
| `DATABASE_PATH` | 数据库文件路径 | ./database/allapi.db |
| `ENCRYPTION_KEY` | API Key 加密密钥 | 生产环境必须修改 |

### 权重配置

渠道权重默认为 1，数值越大权重越高。负载均衡根据权重比例分配请求。

例如：
- 渠道 A 权重 2，渠道 B 权重 1
- 则 A 获得 2/3 的请求，B 获得 1/3 的请求

## 内置服务商

系统内置以下服务商配置（无需手动添加）：

| 服务商 | API 格式 | Base URL |
|--------|----------|----------|
| OpenAI | openai | api.openai.com/v1 |
| Anthropic | anthropic | api.anthropic.com |
| Google Gemini | google | generativelanguage.googleapis.com |
| DeepSeek | deepseek | api.deepseek.com/v1 |
| Groq | groq | api.groq.com/openai/v1 |
| 智谱 AI | zhipu | open.bigmodel.cn |
| 月之暗面 | moonshot | api.moonshot.cn/v1 |
| MiniMax | minimax | api.minimax.chat/v1 |
| 通义千问 | alibaba | dashscope.aliyuncs.com |
| ... | ... | ... |

## 许可证

MIT