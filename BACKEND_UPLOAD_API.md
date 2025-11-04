# 后台图片上传接口说明

## 接口规范

### 上传图片接口

**端点**: `POST /api/admin/upload/image`

**请求头**:
- `Authorization: Bearer {admin_token}` (必需)
- `Content-Type: multipart/form-data`

**请求体**:
- FormData 格式，字段名：`image`
- 支持的文件类型：图片格式（image/*）
- 建议文件大小限制：5MB

**响应格式** (成功):
```json
{
  "url": "/uploads/images/2024/01/15/abc123.jpg",
  "image_url": "/uploads/images/2024/01/15/abc123.jpg"
}
```
或者
```json
{
  "data": {
    "url": "/uploads/images/2024/01/15/abc123.jpg"
  }
}
```

**响应格式** (失败):
```json
{
  "error": "错误信息"
}
```

## 后端实现建议

### 1. 创建图片存储目录

在后端项目根目录下创建 `uploads/images` 文件夹，或按日期组织：
```
uploads/
  images/
    2024/
      01/
        15/
          (图片文件)
```

### 2. 文件命名规则

建议使用以下命名规则：
- 时间戳 + 随机字符串 + 原扩展名
- 例如：`1705315200_abc123def456.jpg`

### 3. 保存路径建议

- 相对路径（前端可访问）：`/uploads/images/2024/01/15/filename.jpg`
- 或绝对URL：`http://localhost:8080/uploads/images/2024/01/15/filename.jpg`

### 4. 接口实现示例 (Node.js/Express)

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const uploadPath = path.join(__dirname, '../uploads/images', year, month, day);
    
    // 如果目录不存在，创建它
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：时间戳 + 随机字符串 + 扩展名
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只能上传图片文件'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// 路由处理
router.post('/admin/upload/image', 
  authenticateAdmin, // 管理员认证中间件
  upload.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    // 构建相对路径
    const relativePath = `/uploads/images/${req.file.path.split('uploads/images/')[1]}`;
    
    res.json({
      url: relativePath,
      image_url: relativePath
    });
  }
);
```

### 5. 静态文件服务配置

确保后端服务器能够提供静态文件服务：

**Express 示例**:
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

这样前端就可以通过 `http://localhost:8080/uploads/images/...` 访问上传的图片。

### 6. 错误处理

需要处理的错误情况：
- 未登录或token无效（401）
- 文件类型不正确（400）
- 文件过大（400）
- 服务器存储错误（500）

## 注意事项

1. **安全验证**：确保只有管理员可以上传图片
2. **文件类型验证**：只允许图片格式
3. **文件大小限制**：建议5MB以内
4. **路径安全**：防止路径遍历攻击
5. **文件名安全**：过滤或重命名危险字符

