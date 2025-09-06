# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

**admin-web** 是 BookNest 的管理员前端，这是一个 Vue 3 + TypeScript 酒店预订平台。这是多前端架构的一部分，其中单个 NestJS 后端为三个专门的前端应用程序（管理端、商家端、客户端）提供服务。

此仓库代表面向管理员的界面，管理员可以在此管理所有商家、订单、成交金额和系统运营。

## 核心架构

### 技术栈
- **框架**: Vue 3 with Composition API
- **TypeScript**: 开启严格模式
- **状态管理**: Pinia (setup stores 模式)
- **路由**: Vue Router 4 with history 模式
- **构建工具**: Vite (遵循 YAGNI 原则的简化配置)
- **样式**: CSS Variables 配合最小化工具类
- **后端集成**: RESTful API 代理到端口 3000 的 NestJS 后端

### 项目结构理念
此代码库严格遵循 **YAGNI (You Aren't Gonna Need It)** 原则，实现真正的最小化配置：

```
src/
├── main.ts              # 应用入口点，集成 Pinia + Router
├── App.vue              # 根组件（router-view容器）
├── router/index.ts      # 路由设置（空routes，按需添加）
├── composables/         # Vue composables (useLoading 实用工具)
├── types/index.ts       # 核心类型定义（75行，API+认证类型）
├── constants/index.ts   # 核心常量（26行，API端点+配置）
├── utils/index.ts       # 工具函数（空文件，严格按需添加）
└── styles/              # 精简 CSS 系统
    ├── reset.css        # CSS 重置
    ├── variables.css    # 核心设计令牌（16个变量）
    └── index.css        # 基础按钮/表单样式
```

### 后端集成
- **API 基础 URL**: `http://localhost:3000` (通过 Vite 代理)
- **API 模式**: `/api/v1/admin/*` 端点
- **认证**: JWT 令牌配合刷新机制
- **响应格式**: 与后端 `ApiResponse<T>` 类型一致

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（端口 5173）
npm run dev

# 类型检查
npm run type-check

# 代码检查（简化的 ESLint 配置）
npm run lint

# 生产构建
npm run build

# 预览生产构建
npm run preview

# 格式化代码
npm run format
```

## 配置方式

此项目使用**最小化、专注的配置**：

### ESLint (38 行)
- 仅 Vue 3 基础规则
- 基本 TypeScript 支持
- 8 个核心规则专注于错误，而非样式

### CSS Variables (35 行)
- 4 个核心颜色（primary, success, warning, error）
- 5 个灰色阴影用于 UI 层次
- 4 个间距级别（sm, md, lg, xl）
- 3 个字体大小（sm, md, lg）
- 基础圆角和过渡效果

### Vite 配置 (38 行)
- Vue 插件配合 DevTools
- 路径别名：`@/` → `src/`
- API 代理到后端
- SCSS 支持，自动导入变量

## 类型系统

### API 集成类型
`src/types/index.ts` (75行) 中的核心类型与 NestJS 后端严格对齐：
- `ApiResponse<T>` - 标准成功响应格式
- `ApiErrorResponse` - 错误响应格式  
- 认证类型（`LoginRequest`、`TokenPair`、`LoginResponse` 等）
- `AdminUser` - 扩展基础 `User` 类型

### 常量配置
`src/constants/index.ts` (26行) 仅包含核心必需常量：
- API 端点（认证相关）
- 应用基础配置
- 本地存储键名

## 状态管理

### Pinia Stores (Composition API)
- 使用 `defineStore` 配合 composition API 语法
- 暂无示例store（已移除counter示例，遵循YAGNI原则）
- Store 文件应按功能命名（例如：`useAuthStore`、`useMerchantStore`）

### Composables 模式
- `useLoading` composable 提供加载状态管理
- Composables 应该是可重用的，专注于单一关注点
- 遵循 Vue 3 composition 模式

## 后端 API 期望

管理员前端期望后端有以下 API 模式：
- 认证：`/api/v1/admin/auth/*`
- 所有响应遵循 `ApiResponse<T>` 格式
- JWT 认证配合 access/refresh 令牌
- 错误响应包含结构化错误对象

## 开发模式

### 添加新功能
1. **类型**: 在 `types/index.ts` 中添加 TypeScript 定义
2. **常量**: 在 `constants/index.ts` 中添加 API 端点
3. **状态**: 使用 composition API 创建 Pinia stores
4. **组件**: 使用 `<script setup>` 配合 TypeScript
5. **样式**: 使用现有 CSS 变量，仅在需要时添加新变量

### API 集成
- 使用既定的 `ApiResponse<T>` 模式
- 通过 JWT 令牌处理认证
- 使用 `ApiErrorResponse` 实现适当的错误处理

### 样式指南
- 使用 `variables.css` 中的 CSS 变量
- 仅在重复使用时才在 `index.css` 中添加工具类
- 遵循最小化设计系统方法

## 重要说明

- **严格YAGNI原则**: 已彻底精简配置，常量文件减少70%，类型文件减少45%。仅在实际需要时添加功能。
- **后端对齐**: 类型和 API 模式必须与 NestJS 后端结构匹配。
- **渐进增强**: 从真正的最小可用配置开始，按需逐步添加。
- **管理聚焦**: 专门针对平台管理员的管理界面。