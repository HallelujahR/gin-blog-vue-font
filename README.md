# 博客前端项目

基于 Vue 3 + Vite 构建的博客前端应用，包含前台展示和后台管理功能。

## 项目介绍

### 技术栈
- **Vue 3** - 渐进式 JavaScript 框架
- **Vue Router** - 官方路由管理器
- **Axios** - HTTP 客户端
- **Quill** - 富文本编辑器
- **Vite** - 下一代前端构建工具

### 功能特性

#### 前台功能
- 📝 文章列表展示（支持分页、搜索、筛选）
- 📄 文章详情页（支持评论、点赞、浏览量统计）
- 🏷️ 分类和标签筛选
- 📊 热门文章推荐
- 📱 响应式设计

#### 后台管理
- 🔐 管理员登录认证
- 📝 文章管理（创建、编辑、删除、富文本编辑）
- 📁 分类管理
- 🏷️ 标签管理
- 💬 评论管理
- 👥 用户管理
- 📄 页面管理
- 🖼️ 图片上传（支持封面图片）

### 项目结构

```
src/
├── api/              # API接口封装
│   ├── index.js      # 前台接口
│   └── admin.js      # 后台接口
├── assets/           # 静态资源
│   └── global.css    # 全局样式
├── components/       # 组件
│   ├── admin/        # 后台组件
│   ├── Comment.vue   # 评论组件
│   └── Sidebar.vue   # 侧边栏组件
├── router/           # 路由配置
│   ├── index.js      # 前台路由
│   └── admin.js      # 后台路由
├── utils/            # 工具函数
│   └── auth.js       # 认证工具
└── views/            # 页面组件
    ├── admin/        # 后台管理页面
    ├── About.vue     # 关于我
    ├── BlogDetail.vue # 文章详情
    └── Home.vue       # 首页
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 接口文档

详细的后端接口文档请参考：
- [后台文章接口文档](./BACKEND_POST_API.md) - 文章创建、编辑、列表接口
- [图片上传接口文档](./BACKEND_UPLOAD_API.md) - 图片上传接口

## 配置说明

### API 基础地址

默认 API 地址：`http://localhost:8080/api`

如需修改，请编辑 `src/api/index.js` 中的 `baseURL`。

### 认证说明

- **后台管理**：使用 `admin_token` 存储在 localStorage
- **前台用户**：预留 `front_token`（当前未使用）

## 注意事项

1. 确保后端服务已启动并运行在 `http://localhost:8080`
2. 后台管理需要管理员权限
3. 图片上传功能需要后端支持 `/api/admin/upload/image` 接口
4. 富文本编辑器使用 Quill，输出 HTML 格式内容

