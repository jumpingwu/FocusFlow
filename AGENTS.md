# FocusFlow 项目上下文

## 项目概述

FocusFlow 是一个基于 Node.js 的个人生产力系统，专注于快速捕获任务和想法。这是一个本地优先的单页应用（SPA），具有完整的任务管理、想法记录、审计日志追踪、每日回顾和归档功能。

### 技术栈

- **后端**: Node.js + Express.js
- **前端**: 原生 JavaScript（无框架），使用自定义组件架构
- **存储**: JSON 文件（`data.json` 为主数据，`data_archive.json` 为归档数据）
- **文件上传**: Multer + 本地 `/uploads` 目录
- **依赖管理**: npm

### 核心架构

```
项目根目录/
├── server.js              # Express 服务器入口
├── data.json              # 主数据存储（需 git 忽略）
├── data.json.bak          # 数据备份文件（需 git 忽略）
├── data_archive.json      # 归档数据存储（需 git 忽略）
├── server/                # 后端逻辑
│   ├── data-manager.js    # 数据层（CRUD 操作、归档管理）
│   ├── validators.js      # 数据验证
│   └── routes/            # API 路由
│       ├── items.js       # 项目 CRUD、归档、过滤
│       ├── upload.js      # 文件上传处理
│       ├── categories.js  # 分类 CRUD
│       └── review.js      # 每日回顾端点
├── public/                # 前端资源
│   ├── index.html         # 主页面
│   ├── css/               # 样式表
│   └── js/                # JavaScript
│       ├── app.js         # 应用入口
│       ├── components/    # UI 组件
│       └── utils/         # 工具函数
└── uploads/               # 文件上传目录（需 git 忽略）
```

## 构建和运行

### 安装依赖

```bash
npm install
```

### 启动应用

```bash
npm start
```

开发模式（自动重启）：

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

### 数据文件

- `data.json`: 主数据文件，存储所有活跃项目和分类
- `data_archive.json`: 归档数据，存储已归档的项目
- `uploads/`: 文件上传目录，存储图片和附件

**重要**: 这些文件应在 `.gitignore` 中排除，避免将用户数据提交到仓库。

## 数据模型

### Item（项目）

```javascript
{
  id: string,                    // UUID
  type: 'Task' | 'Idea',         // 类型
  title: string,                 // 标题
  notes: string,                 // 富文本（Markdown/HTML）
  category: string,              // 分类
  status: 'Todo' | 'In-progress' | 'Pending' | 'Completed' | 'Cancelled',
  priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'Undefined',
  urgency: 'Burning' | 'Today' | 'Later' | 'Undefined',
  targetDate: string,            // YYYY-MM-DD 格式
  createdAt: string,             // ISO 时间戳
  attachments: string[],         // 上传文件路径数组
  logs: LogEntry[]               // 审计日志
}
```

### LogEntry（日志条目）

```javascript
{
  timestamp: string,             // ISO 时间戳
  type: 'manual' | 'system',     // 日志类型
  msg: string,                   // 日志消息
  previousValue?: any            // Notes 字段变更时的完整旧值
}
```

### ArchivedItem（归档项目）

```javascript
{
  item: Item,                    // 完整的项目快照
  archivedAt: string,            // 归档时间（ISO）
  archivedBy: 'manual' | 'morning_reset'  // 归档方式
}
```

## API 端点

### 项目管理

- `GET /api/items` - 获取所有项目（支持过滤和搜索）
- `POST /api/items` - 创建新项目
- `GET /api/items/:id` - 获取单个项目
- `PUT /api/items/:id` - 更新项目
- `DELETE /api/items/:id` - 删除项目
- `POST /api/items/:id/logs` - 添加手动日志
- `POST /api/items/:id/archive` - 归档项目

### 归档管理

- `GET /api/items/archived` - 获取所有归档项目
- `POST /api/items/archived/:id/restore` - 恢复归档项目
- `DELETE /api/items/archived/:id` - 永久删除归档项目

### 分类管理

- `GET /api/categories` - 获取所有分类
- `POST /api/categories` - 创建新分类

### 文件上传

- `POST /api/upload` - 上传文件

### 每日回顾

- `GET /api/review/overdue` - 获取逾期项目
- `POST /api/review/complete` - 完成每日回顾

## 前端组件架构

### 核心组件

- **GhostBar** (`ghost-bar.js`): 顶部快速捕获和搜索栏
- **TaskList** (`task-list.js`): 项目列表，按矩阵分组显示
- **DetailPanel** (`detail-panel.js`): 项目详情面板
- **RichTextEditor** (`rich-text-editor.js`): 富文本编辑器，支持 Markdown
- **AttachmentsGallery** (`attachments-gallery.js`): 附件画廊
- **LogHistory** (`log-history.js`): 进度日志历史
- **DailyReviewModal** (`daily-review-modal.js`): 每日回顾模态框
- **Sidebar** (`sidebar.js`): 分类侧边栏
- **CreatableSelect** (`creatable-select.js`): 可创建的选择框

### 工具模块

- **api.js**: API 客户端
- **helpers.js**: 辅助函数（Markdown 解析等）
- **shortcuts.js**: 键盘快捷键
- **storage.js**: 本地存储工具

## 开发约定

### 数据验证

所有数据操作必须通过 `validators.js` 进行验证：

- `sanitizeItem()`: 清理和标准化项目数据
- `validateItem()`: 验证项目数据完整性
- `validateLogEntry()`: 验证日志条目

### 审计日志

所有数据变更必须记录审计日志：

- 字段变更（Status、Priority、Urgency、TargetDate）自动生成系统日志
- Notes 字段变更时，`previousValue` 必须包含完整的旧值
- 手动日志通过 `addManualLog()` 添加

### 键盘快捷键

应用会自动检测平台并使用相应的修饰键：

**macOS:**
- `Ctrl + Shift + F/N`: 聚焦 Ghost Bar（搜索/捕获）
- `Ctrl + Shift + Enter`: 创建新任务或保存并关闭详情面板
- `Ctrl + Shift + Up/Down`: 在项目列表中导航
- `Ctrl + Shift + 1/2/3/4/5`: 设置状态（仅详情面板打开时）
- `Esc`: 清除搜索或关闭面板/模态框

**Windows / Linux:**
- `Alt + F/N`: 聚焦 Ghost Bar（搜索/捕获）
- `Alt + Enter`: 创建新任务或保存并关闭详情面板
- `Alt + Up/Down`: 在项目列表中导航
- `Alt + 1/2/3/4/5`: 设置状态（仅详情面板打开时）
- `Esc`: 清除搜索或关闭面板/模态框

**平台检测:**
使用 `navigator.platform` 检测操作系统，Mac 平台返回 `true`，其他平台返回 `false`。

### 富文本编辑器

Notes 和 Progress Update 字段支持 Markdown：

- **标题**: `# H1`, `## H2`
- **粗体**: `**text**`
- **斜体**: `*text*`
- **链接**: `[text](url)`
- **图片**: `![alt](url)`
- **代码**: `` `code` `` 或 ``` ```code``` ```
- **列表**: `- item` 或 `1. item`
- **表格**: `| Header | Header |`

### 归档系统

- 归档不是状态，而是存储位置
- 活跃项目存储在 `data.json`
- 归档项目存储在 `data_archive.json`
- 归档时保留原始状态
- 支持恢复和永久删除

### 过滤和搜索

- **全局搜索**: 匹配 Title、Category、Notes 和手动日志内容
- **逾期过滤**: `status != Completed/Cancelled` AND `targetDate < Today`
- **今日过滤**: `targetDate == today` OR `urgency == 'Today'` OR `urgency == 'Burning'`
- **矩阵分组**: 始终按四个象限分组（Burning & Critical、Today & High、Other Tasks、Ideas）

## 重要注意事项

1. **本地优先**: 应用设计为本地运行，无需外部数据库
2. **数据备份**: 每次写入 `data.json` 前会自动创建备份
3. **文件上传**: 支持拖放和粘贴，图片自动保存到 `/uploads`
4. **每日回顾**: 每天首次启动时，如果有逾期项目会显示回顾模态框
5. **动态分类**: 创建新分类时立即更新全局状态，无需刷新页面
6. **Markdown 渲染**: 支持 Markdown 到 HTML 的转换，用于富文本显示

## 常见任务

### 添加新功能

1. 在 `server/routes/` 中添加新的 API 端点
2. 在 `server/data-manager.js` 中实现数据操作
3. 在 `public/js/components/` 中创建或更新前端组件
4. 更新相关样式文件

### 修改数据模型

1. 更新 `server/validators.js` 中的验证规则
2. 更新 `server/data-manager.js` 中的数据处理逻辑
3. 确保前端组件正确处理新字段

### 添加键盘快捷键

1. 在 `public/js/utils/shortcuts.js` 中注册快捷键
2. 确保快捷键不与现有功能冲突
3. 在 README.md 中文档化新快捷键

## 测试

目前项目没有自动化测试。建议：

- 手动测试所有 API 端点
- 验证数据验证逻辑
- 测试文件上传和附件功能
- 验证归档和恢复功能
- 测试键盘快捷键