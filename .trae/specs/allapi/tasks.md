# AllApi 开发任务

## 任务列表

- [x] Task 1: 项目初始化与架构搭建
  - [x] SubTask 1.1: 初始化 Node.js 后端项目，选择 Express.js 或 Fastify
  - [x] SubTask 1.2: 初始化 Vite + React 前端项目（或根据决定选择 Vue）
  - [x] SubTask 1.3: 配置项目目录结构
  - [x] SubTask 1.4: 配置数据库（SQLite for dev, PostgreSQL schema design）
  - [x] SubTask 1.5: 配置代理环境变量

- [x] Task 2: 数据库设计与实现
  - [x] SubTask 2.1: 设计 Provider 数据模型
  - [x] SubTask 2.2: 设计 Model 数据模型
  - [x] SubTask 2.3: 实现数据库迁移和种子数据（内置渠道）

- [x] Task 3: 后端核心功能实现
  - [x] SubTask 3.1: 实现 Provider CRUD API
  - [x] SubTask 3.2: 实现 Model CRUD API
  - [x] SubTask 3.3: 实现 API 转发核心逻辑
  - [x] SubTask 3.4: 实现模型重写功能
  - [x] SubTask 3.5: 实现轮询负载均衡
  - [x] SubTask 3.6: 实现 X-ALL-API-PROVIDER 请求头处理
  - [x] SubTask 3.7: 实现前缀缓存亲和性

- [x] Task 4: 前端核心功能实现
  - [x] SubTask 4.1: 实现渠道管理页面（列表、新增、编辑、删除）
  - [x] SubTask 4.2: 实现模型管理页面
  - [x] SubTask 4.3: 实现统计页面（消费统计）
  - [x] SubTask 4.4: 集成 LobeHub Icons 图标系统
  - [x] SubTask 4.5: 美化前端界面，现代感设计

- [x] Task 5: 内置渠道数据
  - [x] SubTask 5.1: 预置所有内置渠道配置
  - [x] SubTask 5.2: 预置常用模型映射
  - [x] SubTask 5.3: 预置模型价格和图标

- [x] Task 6: 测试与验证
  - [x] SubTask 6.1: API 转发功能测试
  - [x] SubTask 6.2: 前端功能测试
  - [x] SubTask 6.3: 负载均衡测试

## 任务依赖

- Task 2 依赖 Task 1
- Task 3 依赖 Task 2
- Task 4 可与 Task 3 并行开发，但依赖 Task 1 的基础架构
- Task 5 依赖 Task 2 和 Task 3
- Task 6 依赖 Task 3 和 Task 4
