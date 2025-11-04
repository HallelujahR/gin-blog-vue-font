# 后台文章创建/编辑接口说明

## 接口规范

### 1. 创建文章接口

**端点**: `POST /api/admin/posts`

**请求头**:
- `Authorization: Bearer {admin_token}` (必需)

**请求格式**（两种方式）：

#### 方式A: 有图片文件时（FormData）

**Content-Type**: `multipart/form-data`

**表单字段**:
- `image` (File): 封面图片文件
- `title` (String, 必需): 文章标题
- `excerpt` (String, 可选): 文章摘要
- `content` (String, 必需): 文章内容
- `category_ids[]` (Array[Number], 可选): 分类ID数组（可多选）
- `tag_ids[]` (Array[Number], 可选): 标签ID数组（可多选）
- `status` (String, 可选): 文章状态，值：`draft` 或 `published`，默认 `draft`

**示例**:
```
FormData:
  image: [File对象]
  title: "我的第一篇文章"
  excerpt: "这是文章摘要"
  content: "# 标题\n\n文章内容..."
  category_ids[]: [1, 2]
  tag_ids[]: [3, 4, 5]
  status: "published"
```

#### 方式B: 无图片文件时（JSON）

**Content-Type**: `application/json`

**请求体**:
```json
{
  "title": "我的第一篇文章",
  "excerpt": "这是文章摘要",
  "content": "# 标题\n\n文章内容...",
  "cover_image": "/uploads/images/2024/01/15/image.jpg",
  "category_ids": [1, 2],
  "tag_ids": [3, 4, 5],
  "status": "published"
}
```

### 2. 更新文章接口

**端点**: `PUT /api/admin/posts/{id}`

**请求头**:
- `Authorization: Bearer {admin_token}` (必需)

**请求格式**（两种方式）：

#### 方式A: 有新图片文件时（FormData）

**Content-Type**: `multipart/form-data`

**表单字段**:
- `image` (File): 新的封面图片文件（如果提供，将替换原有图片）
- `title` (String, 必需): 文章标题
- `excerpt` (String, 可选): 文章摘要
- `content` (String, 必需): 文章内容
- `category_ids[]` (Array[Number], 可选): 分类ID数组
- `tag_ids[]` (Array[Number], 可选): 标签ID数组
- `status` (String, 可选): 文章状态

#### 方式B: 无新图片文件时（JSON）

**Content-Type**: `application/json`

**请求体**:
```json
{
  "title": "更新后的标题",
  "excerpt": "更新后的摘要",
  "content": "更新后的内容...",
  "cover_image": "/uploads/images/2024/01/15/image.jpg",
  "category_ids": [1, 2],
  "tag_ids": [3, 4, 5],
  "status": "published"
}
```

## 响应格式

### 成功响应

**状态码**: `200` 或 `201`

**响应体**:
```json
{
  "post": {
    "id": 1,
    "title": "我的第一篇文章",
    "excerpt": "这是文章摘要",
    "content": "# 标题\n\n文章内容...",
    "cover_image": "/uploads/images/2024/01/15/abc123.jpg",
    "category_ids": [1, 2],
    "tag_ids": [3, 4, 5],
    "status": "published",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```
或
```json
{
  "data": {
    "post": {
      "id": 1,
      ...
    }
  }
}
```

### 错误响应

**状态码**: `400`, `401`, `422` 等

**响应体**:
```json
{
  "error": "错误信息"
}
```
或
```json
{
  "message": "错误信息"
}
```

## 后端实现要点

### 1. 文件处理（当使用FormData时）

当接收到 `image` 文件时，后端需要：

1. **验证文件**:
   - 文件类型必须是图片（image/*）
   - 文件大小限制（建议5MB以内）

2. **保存文件**:
   - 保存到 `uploads/images/` 目录
   - 建议按日期组织：`uploads/images/2024/01/15/`
   - 生成唯一文件名：`时间戳_随机字符串.扩展名`

3. **生成图片URL**:
   - 相对路径：`/uploads/images/2024/01/15/filename.jpg`
   - 或完整URL：`http://localhost:8080/uploads/images/2024/01/15/filename.jpg`

4. **保存到数据库**:
   - 将图片URL保存到 `cover_image` 字段

### 2. 数组字段处理

FormData中的数组字段有两种常见格式：

**格式1**（前端当前使用）:
```
category_ids[]: 1
category_ids[]: 2
tag_ids[]: 3
tag_ids[]: 4
```

**格式2**（备用）:
```json
{
  "category_ids": "[1, 2]",
  "tag_ids": "[3, 4]"
}
```

后端需要根据使用的框架自动解析：

- **Express/Node.js**: 使用 `multer` 处理FormData，数组字段自动解析为数组
- **Laravel/PHP**: 自动处理 `field[]` 格式
- **Django/Python**: 可能需要手动处理或使用中间件

### 3. 示例实现（Node.js/Express）

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const uploadPath = path.join(__dirname, '../uploads/images', year, month, day);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只能上传图片文件'), false);
    }
  }
});

// 创建文章 - 支持FormData和JSON
router.post('/admin/posts', authenticateAdmin, async (req, res) => {
  try {
    let coverImageUrl = '';
    
    // 如果使用了multer中间件，检查是否有文件
    const uploadSingle = upload.single('image');
    
    uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      let postData = {};
      
      // 如果是FormData请求（有文件）
      if (req.file) {
        // 构建图片URL
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        coverImageUrl = `/uploads/images/${year}/${month}/${day}/${req.file.filename}`;
        
        // 从FormData获取其他字段
        postData = {
          title: req.body.title,
          excerpt: req.body.excerpt || '',
          content: req.body.content,
          cover_image: coverImageUrl,
          category_ids: req.body['category_ids[]'] || req.body.category_ids || [],
          tag_ids: req.body['tag_ids[]'] || req.body.tag_ids || [],
          status: req.body.status || 'draft',
        };
      } else {
        // JSON请求
        postData = {
          title: req.body.title,
          excerpt: req.body.excerpt || '',
          content: req.body.content,
          cover_image: req.body.cover_image || '',
          category_ids: req.body.category_ids || [],
          tag_ids: req.body.tag_ids || [],
          status: req.body.status || 'draft',
        };
      }
      
      // 保存文章到数据库
      const post = await Post.create(postData);
      
      res.status(201).json({
        post: {
          ...post.toJSON(),
          cover_image: post.cover_image
        }
      });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 更新文章 - 类似实现
router.put('/admin/posts/:id', authenticateAdmin, async (req, res) => {
  // 类似的逻辑，但需要处理现有图片的删除（如果上传了新图片）
});
```

## 注意事项

1. **Content-Type检测**: 后端需要根据 `Content-Type` 判断是FormData还是JSON
2. **数组字段解析**: 不同框架对FormData数组的处理方式不同，需要相应适配
3. **文件验证**: 必须验证文件类型和大小，防止恶意上传
4. **旧文件清理**: 编辑文章时如果上传了新图片，建议删除旧的图片文件
5. **静态文件服务**: 确保 `/uploads` 路径可以通过HTTP访问

