# Sharkdown 二阶段 Share Markdown 产品路线图计划书

**日期：2026-05-14**  
**阶段定位：Phase 2 / Share Markdown 外围能力扩展**  
**核心约束：继续保持离线优先、静态网页架构；不引入自有后端、不上传用户内容。**  
**核心目标：把 Sharkdown 从“Markdown 转图片/PDF 工具”扩展为“Markdown 内容的本地创作、整理、打包、交付、分享工作台”。**

---

## 1. 结论先行

Phase 1 已经完成了 Markdown 编辑、实时预览、本地图片引用、主题、图片导出、文字版 PDF 打印导出等核心能力。Phase 2 的产品方向不应该转向服务端协作平台，而应该围绕 **Share Markdown** 做外围能力扩宽：让用户在不登录、不联网、不上传内容的前提下，把一份 Markdown 以不同交付形态安全、体面、可复用地发给别人。

二阶段建议形成 6 条主线：

1. **本地文档库**：多文档管理、标签、搜索、历史版本、回收站，把 Sharkdown 从单文档工具升级为离线工作台。
2. **分享包体系**：定义 `.sharkdown` 可携带工程包，包含 Markdown、主题、图片、导出设置和元数据，解决“发给别人还能继续编辑”的问题。
3. **单文件交付物**：导出自包含 HTML、纯 Markdown、HTML 片段、PDF、图片、幻灯片、长文阅读页，解决“发给别人直接看”的问题。
4. **轻量链接分享**：对短文档支持压缩 URL fragment / QR 码 / Web Share API，解决“快速转发”的问题，同时明确 URL 长度和隐私边界。
5. **分享场景模板**：增加面向社交图、公众号/知识卡、技术 README、产品更新、会议纪要、论文笔记、幻灯片、邮件正文等场景的模板和样式。
6. **离线 PWA 与本地文件流**：支持安装、离线打开、文件拖拽、文件保存、从系统分享入口接收内容，降低日常使用摩擦。

一句话：**Phase 2 不做“云端协作版 HackMD”，而做“离线版 Markdown 交付套件”。**

---

## 2. 当前产品基线

### 2.1 已有能力

当前 Sharkdown 已具备以下基础：

- Markdown 编辑与实时预览。
- GitHub Flavored Markdown、表格、任务列表、链接、删除线。
- KaTeX 数学公式。
- Mermaid 图表。
- Shiki 代码高亮。
- 本地图片以 `local-image://` 短引用形式插入，图片 Blob 存储在浏览器本地 IndexedDB。
- 主题预设，包括 Claude、GPT、Apple、Google、WeChat、Douyin、黑黄、GitHub、纸张等风格。
- PNG/JPEG/WebP/SVG 图片导出。
- PNG 复制到剪贴板。
- 长图切片 PNG 导出。
- 文字版 PDF 通过浏览器打印生成，可保留可选择文本和目录链接。
- localStorage 持久化当前文档和设置。
- GitHub Pages 静态部署。

### 2.2 当前短板

从 Share Markdown 角度看，当前版本仍是单文档导出工具，缺少以下产品闭环：

- 没有多文档库，用户无法沉淀一组 Markdown 资产。
- 没有完整“项目包”格式，别人收到图片/PDF 后无法继续编辑源 Markdown。
- 没有自包含 HTML 阅读页，无法发一个单文件给非技术用户打开阅读。
- 没有短链接/二维码式转发路径。
- 没有面向特定分享场景的模板体系。
- 没有导入/导出预设、主题、文档库备份。
- 没有版本历史、快照、差异对比，分享前后难以回滚。
- 没有 PWA 离线安装和缓存保证，仍像一个网页而不是本地工具。
- 没有系统级分享能力，例如调用系统分享面板、保存到本地文件、接收分享文件。

---

## 3. 外部产品与 Web 能力参考

### 3.1 竞品能力启发

HackMD 把 Markdown 分享做成协作工作区，突出文档即时分享、权限、模板、Book Mode、GitHub 集成和 UML 图表能力。Sharkdown 不引入服务器，因此不能照搬协作/权限模型，但可以借鉴“模板、书籍集合、GitHub/文件同步、图表支持、个人发布页”的功能外形，改造成离线打包与静态导出能力。

StackEdit 的重点是浏览器内编辑体验、WYSIWYG 工具栏、滚动同步、云端同步、发布到外部平台、离线写作和评论。Sharkdown 应借鉴滚动同步、格式工具栏、多文档、离线写作、评论式标注，但同步和发布需要保持为用户主动导出文件、复制 HTML 或调用系统分享。

HedgeDoc 强调自托管、实时协作、展示模式、图表、权限和版本。Sharkdown 不能在纯静态架构下提供多人实时编辑，但可以做本地版本、阅读发布页、Markdown 幻灯片、图表增强和分享包权限提示。

### 3.2 Web 平台能力

这些浏览器能力可以支撑 Phase 2，且不要求自有后端：

- **IndexedDB**：适合存储较大的结构化数据和 Blob，可承载多文档库、图片、版本快照、导出缓存。
- **Service Worker + Cache API**：让静态站离线可用，提供 PWA 安装和资源缓存。
- **File System Access API / File System API**：在支持的浏览器中读写本地文件，提供“打开 `.md` / 另存为 `.md` / 保存 `.sharkdown` 包”的近桌面体验。
- **Web Share API**：在支持的浏览器中调用系统分享面板，分享文本、链接或文件；需要提供剪贴板/下载 fallback。
- **Web Crypto API**：可用于客户端加密分享包、生成校验摘要和私密分享链接。
- **CompressionStream**：可压缩短 Markdown 文档，用于 URL fragment 分享、二维码、分享包压缩前处理。

---

## 4. 产品原则

### 4.1 离线优先

所有核心功能必须在无网络、无登录、无后端情况下可用。网络能力只能作为“外部目标”，例如用户主动复制到 GitHub、下载 HTML 后自行发布，不能变成产品运行依赖。

### 4.2 内容不出浏览器

Markdown、图片、主题、导出结果默认都留在本地。任何“分享”都必须是用户显式触发的导出、复制、下载、系统分享或文件保存动作。

### 4.3 分享是多形态交付

Share Markdown 不等于生成链接。对于离线静态工具，应定义多种分享对象：

- 发给技术用户：`.md`、`.sharkdown` 工程包、HTML 片段。
- 发给普通读者：自包含 HTML、PDF、图片、长图。
- 发给移动端：二维码、系统分享、图片卡片。
- 发给编辑器/平台：纯 Markdown、HTML、公众号/Notion/GitHub 友好片段。
- 发给会议/演示场景：幻灯片 HTML、演讲者备注、导出 PDF。

### 4.4 不伪装成云协作

没有后端就不承诺多人实时协作、权限控制、在线链接托管。可以做“本地注释、版本历史、导出只读包、加密包”，但要明确这些是本地交付能力，不是云端访问控制。

### 4.5 渐进增强

高级 Web API 的浏览器支持不一致，因此必须有 fallback：

- Web Share 不可用时，退回复制/下载。
- File System Access 不可用时，退回 `<input type=file>` 和 Blob 下载。
- CompressionStream 不可用时，退回 JS 压缩库或禁用短链接。
- Service Worker 不可用时，仍可在线打开静态页使用基本功能。

---

## 5. 二阶段功能版图

## 5.1 本地文档库

### 目标

把当前“单文档自动保存”扩展成“离线多文档空间”，让用户可以长期管理 Markdown 内容。

### 功能清单

- 新建、复制、重命名、删除文档。
- 文档列表：标题、摘要、更新时间、字数、主题、标签、是否含本地图片。
- 文档搜索：标题、正文、标签、导出备注。
- 标签与颜色：技术、文章、会议、卡片、待发布、归档等。
- 收藏/置顶。
- 回收站：删除后保留 7/30 天，手动清空。
- 最近打开。
- 本地容量提示：显示文档数量、图片数量、估算占用空间。
- 一键备份文档库为 `.sharkdown-backup`。
- 从备份恢复。

### 数据设计建议

```ts
interface SharkdownDocument {
  id: string;
  title: string;
  markdown: string;
  themeId: string;
  exportSettings: ExportSettingsSnapshot;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  thumbnail?: BlobReference;
  assetIds: string[];
}
```

```ts
interface SharkdownLibraryIndex {
  version: 2;
  documents: SharkdownDocument[];
  tags: Array<{ id: string; name: string; color: string }>;
  recentDocumentIds: string[];
}
```

### 技术路线

- 使用 IndexedDB 作为主存储。
- localStorage 只保留当前打开文档 ID、UI 设置和迁移标记。
- 图片 Blob 继续存在 IndexedDB，但需要建立 asset 引用计数。
- 文档搜索先做轻量本地索引，不引入大型搜索库；中文搜索使用简单包含匹配 + 标题/标签权重。

### 验收标准

- 用户刷新页面后能恢复文档库。
- 至少 100 篇中等长度 Markdown 文档仍能流畅列表和搜索。
- 删除文档不会立刻丢失图片，清理回收站时才进行孤立 asset 回收。
- 支持导入旧版单文档 localStorage 状态并迁移为第一篇文档。

---

## 5.2 `.sharkdown` 工程包

### 目标

解决“我想把 Markdown 发给别人继续编辑，同时保留图片、主题和导出设置”的问题。

### 格式定位

`.sharkdown` 是 Sharkdown 的离线工程包。它不是图片，不是 PDF，而是可再次打开编辑的完整内容包。

### 包内容

建议本质上使用 ZIP 或压缩 JSON Blob，内部结构如下：

```text
document.sharkdown
  manifest.json
  content.md
  settings.json
  theme.json
  assets/
    img_001.png
    img_002.jpg
  thumbnails/
    preview.webp
```

### manifest 示例

```json
{
  "format": "sharkdown-project",
  "version": 2,
  "createdBy": "Sharkdown",
  "createdAt": "2026-05-14T00:00:00.000Z",
  "title": "产品路线图",
  "contentFile": "content.md",
  "settingsFile": "settings.json",
  "themeFile": "theme.json",
  "assets": [
    {
      "id": "img_001",
      "path": "assets/img_001.png",
      "mime": "image/png",
      "originalName": "diagram.png",
      "sha256": "..."
    }
  ]
}
```

### 功能清单

- 导出 `.sharkdown` 工程包。
- 导入 `.sharkdown` 工程包。
- 导入时检测重复文档：新建副本 / 覆盖当前 / 合并到文档库。
- 导出时可选择是否包含：
  - 本地图片。
  - 自定义主题。
  - 导出设置。
  - 历史版本。
  - 缩略图。
- 可选“私密包”：用口令在浏览器端加密。
- 包完整性校验：导入时校验 manifest、资产引用、版本号。

### 技术路线

- 初版可使用纯 JSON + Blob 打包，简单可靠。
- 当图片多、体积大时引入 ZIP 库或浏览器压缩流。
- 使用 Web Crypto 计算 SHA-256，私密包使用 AES-GCM。
- 导入失败必须展示可理解错误：版本不支持、图片缺失、加密口令错误、包损坏。

### 验收标准

- 导出的 `.sharkdown` 重新导入后，Markdown、图片、主题、尺寸、PDF 设置一致。
- 断网状态下可完成导入导出。
- 私密包错误口令不能读取明文内容。
- 大图包导入时不会阻塞 UI，应展示进度。

---

## 5.3 自包含 HTML 分享页

### 目标

解决“别人不安装 Sharkdown，也不懂 Markdown，但我想给他一个能打开的漂亮页面”的问题。

### 分享页形态

导出一个单独 `.html` 文件，双击即可打开。文件内包含：

- 渲染后的正文 HTML。
- 当前主题 CSS。
- KaTeX 必要样式。
- Mermaid 已渲染 SVG。
- 本地图片转为 data URL。
- 目录。
- 元数据：标题、作者、生成时间、字数、来源工具。
- 可选嵌入原始 Markdown。
- 可选“在 Sharkdown 中继续编辑”按钮：读取内嵌 Markdown 并导入。

### 模式

1. **只读阅读页**：体积较小，适合发给普通读者。
2. **可回编辑页**：内嵌原始 Markdown 和设置，适合对方继续使用 Sharkdown。
3. **演示页**：按标题拆成 slide sections，适合投屏。
4. **长文页**：目录固定、阅读进度、打印优化。

### 关键约束

- 不依赖外链资源，否则离线打开会损坏。
- 不执行用户原始 HTML 脚本。
- Mermaid 应在导出前渲染成静态 SVG，而不是在分享页里重新跑 Mermaid。
- 如果内嵌 Markdown，需要在页面中标明“此文件包含源文档内容”。

### 验收标准

- 导出的 HTML 在断网状态下可打开。
- 图片、公式、图表、代码高亮均保留。
- 浏览器打印该 HTML 时样式正常。
- 普通用户可以在微信/邮件/网盘里接收并打开。

---

## 5.4 URL Fragment 轻分享与二维码

### 目标

解决“短内容快速发给手机或聊天窗口”的问题。

### 方案

将短 Markdown 文档压缩后写入 URL fragment：

```text
https://quaternijkon.github.io/sharkdown/#/share?payload=<compressed_payload>
```

注意：fragment 不会作为 HTTP 请求路径的一部分发送给服务器，但浏览器和聊天软件可能记录完整 URL，因此它不是绝对私密通道。敏感内容必须使用加密分享或工程包。

### 功能清单

- “生成轻分享链接”。
- 自动判断长度：
  - 小于安全阈值：生成链接。
  - 超过阈值：建议导出 `.sharkdown` 或 HTML。
- 生成二维码。
- 一键复制链接。
- 一键系统分享。
- 可选“只读打开”或“导入为可编辑文档”。
- 可选口令加密：
  - 链接只包含密文。
  - 用户另行发送口令。

### 适合场景

- 一屏以内的知识卡。
- 会议纪要摘要。
- prompt 模板。
- 小段代码说明。
- 社交平台草稿。

### 不适合场景

- 含多张本地图片的文档。
- 长文。
- 高敏感内容。
- 需要长期稳定访问的公开页面。

### 验收标准

- 短内容生成链接后，在同一浏览器新标签页可恢复。
- 复制链接到另一台设备浏览器可恢复。
- 超长内容不会生成危险超长 URL，而是提示使用工程包或 HTML。
- 加密链接在错误口令下不能恢复正文。

---

## 5.5 原生分享与剪贴板增强

### 目标

让 Sharkdown 的内容更容易进入其他应用：微信、飞书、邮件、Notion、GitHub、公众号编辑器、知识库、幻灯片工具。

### 功能清单

#### 复制类

- 复制 Markdown。
- 复制纯文本。
- 复制 HTML 片段。
- 复制富文本到剪贴板：同时写入 `text/html` 和 `text/plain`。
- 复制图片。
- 复制当前主题 CSS 变量。
- 复制引用卡片：标题、摘要、链接、二维码。

#### 分享类

- 使用 Web Share API 分享：
  - 文本。
  - 当前导出的 PNG。
  - PDF 文件。
  - `.sharkdown` 包。
- Web Share 不可用时自动退回下载/复制。

#### 平台适配

- GitHub README：保留 GFM，图片引用处理为相对路径提示。
- Notion/飞书/语雀：优先复制 HTML + 纯文本。
- 公众号：复制安全 HTML 片段，尽量保留内联样式。
- 邮件：复制富文本正文和附件导出。
- 微信聊天：优先图片卡片或 PDF。

### 技术路线

- 建立 `SharePanel`，按“复制 / 下载 / 系统分享 / 平台适配”分组。
- 将现有导出按钮从单一 ExportPanel 扩展成 Share Workflow。
- 统一 share target 类型：

```ts
type ShareArtifactKind =
  | 'markdown'
  | 'plainText'
  | 'htmlFragment'
  | 'image'
  | 'pdf'
  | 'selfContainedHtml'
  | 'sharkdownProject'
  | 'url';
```

### 验收标准

- 复制 HTML 到常见富文本编辑器时保留标题、列表、表格、代码块基本样式。
- Web Share 不支持时不会报错，而是展示 fallback。
- 分享文件不改变当前文档状态。

---

## 5.6 分享场景模板

### 目标

让用户不是“从空白 Markdown 开始”，而是从“我要分享到哪里”开始。

### 模板分类

#### 社交传播

- 知识卡片。
- 长图解释。
- 小红书/朋友圈图文。
- Twitter/X 长图。
- 微信聊天卡片。
- 产品发布公告。

#### 技术文档

- README 片段。
- API 说明。
- Changelog。
- Bug report。
- 技术方案。
- 架构记录 ADR。

#### 工作流

- 会议纪要。
- 周报。
- 项目复盘。
- Roadmap。
- PRD 摘要。
- 竞品分析。

#### 阅读与演示

- 长文阅读页。
- 书籍/章节模式。
- 幻灯片模式。
- 论文/学习笔记。

### 模板结构

```ts
interface ShareTemplate {
  id: string;
  name: string;
  category: 'social' | 'technical' | 'work' | 'reading' | 'presentation';
  markdown: string;
  themeId: string;
  canvas: {
    width: number;
    padding: number;
    radius: number;
    fontScale: number;
    background: string;
  };
  recommendedArtifacts: ShareArtifactKind[];
}
```

### 产品体验

- 新建文档时选择模板。
- 当前文档可“套用模板”，只改变样式不改正文。
- 模板可收藏。
- 用户可把当前文档保存为自定义模板。
- 模板可导入/导出 JSON。

### 验收标准

- 至少提供 20 个内置模板。
- 每个模板都能导出图片、PDF 或 HTML。
- 模板不会覆盖用户正文，除非用户明确选择“替换内容”。

---

## 5.7 阅读、书籍与幻灯片模式

### 目标

拓展 Markdown 分享的“消费场景”：读、讲、归档。

### 阅读模式

- 清爽阅读版预览。
- 自动目录。
- 阅读进度。
- 代码块复制。
- 图片灯箱。
- 公式/图表静态渲染。
- 打印优化。

### 书籍模式

- 用多篇本地文档组成一个 collection。
- 左侧章节树。
- 导出整本书为：
  - 单文件 HTML。
  - 多页静态 HTML 包。
  - PDF。
  - `.sharkdown-book` 包。

### 幻灯片模式

- 按 `---`、`#`、`##` 分割 slides。
- 支持封面、目录、章节页、结束页。
- 支持演讲者备注。
- 支持导出：
  - HTML 幻灯片。
  - PDF slides。
  - PNG slides。

### 验收标准

- 同一篇 Markdown 可在卡片、阅读、幻灯片之间切换。
- 幻灯片 HTML 可断网播放。
- 书籍模式支持至少 30 篇文档组成目录。

---

## 5.8 版本历史、快照与批注

### 目标

让分享前后的修改可追踪、可回滚，补足离线工作台的“安全感”。

### 功能清单

- 自动快照：每隔 N 分钟或关键操作前保存。
- 手动快照：命名版本，例如“发布前”。
- 版本列表：时间、字数变化、标题变化。
- 版本恢复。
- Markdown diff：行级差异。
- 分享记录：
  - 什么时间导出了什么格式。
  - 使用了哪个主题。
  - 是否包含图片。
- 本地批注：
  - 对段落添加备注。
  - 备注不进入默认导出，除非选择“带批注导出”。

### 技术路线

- 初版快照存完整 Markdown，后续再考虑 diff 压缩。
- 限制每文档快照数量，例如最近 50 个自动快照 + 无限手动快照。
- 大文档快照做体积提示。

### 验收标准

- 修改后可恢复到上一版本。
- 导出前自动生成一个“导出前快照”。
- 删除文档后仍可在回收站恢复最近版本。

---

## 5.9 PWA 与本地文件流

### 目标

让 Sharkdown 更像本地应用，而不是每次打开网页。

### 功能清单

- Web App Manifest。
- Service Worker 缓存 app shell。
- 离线启动页面。
- 更新提示：有新版本时提示刷新。
- “打开本地 Markdown 文件”。
- “另存为 Markdown 文件”。
- “保存副本为 `.sharkdown`”。
- 拖拽 `.md`、`.markdown`、`.sharkdown`、图片文件到页面。
- 可选 Web Share Target：从系统分享菜单把 Markdown 或文本发给 Sharkdown。

### 注意事项

- GitHub Pages 可承载静态 PWA，但路径、base URL、缓存更新要格外谨慎。
- Service Worker 更新必须处理 hash 资源，避免用户卡在旧版本。
- iOS Safari 的 PWA/offline 行为有边界，必须在 UI 中提供“离线可用性检查”。

### 验收标准

- 首次在线打开后，断网刷新仍可进入应用。
- 主要 JS/CSS/font 资源命中缓存。
- 新版本部署后能提示用户更新。
- 打开本地 `.md` 不会上传内容。

---

## 5.10 质量、诊断与隐私说明

### 目标

提升工具可信度，避免用户在分享时误判隐私或格式。

### 功能清单

- 分享前检查：
  - 是否包含本地图片。
  - 是否包含远程图片。
  - 是否包含 raw HTML。
  - 是否包含疑似敏感信息：邮箱、手机号、token 样式字符串。
  - 导出目标是否会嵌入源 Markdown。
- 格式诊断：
  - 图片过大。
  - 文档过长。
  - URL 分享超长。
  - PDF 页边距异常。
  - 表格太宽。
- 隐私面板：
  - 当前内容是否离开浏览器。
  - 当前分享物包含哪些数据。
  - 浏览器本地保存了什么。
  - 如何清除本地数据。

### 验收标准

- 用户导出含源文档的 HTML 或 `.sharkdown` 包前，有明确提示。
- 用户生成 URL 分享前，明确提示 URL 可能被聊天软件记录。
- 清除本地数据可以清掉文档、图片、模板、历史版本。

---

## 6. 信息架构调整

二阶段建议把右侧控制区从“主题/尺寸/导出”调整为面向分享工作流：

```text
左侧：文档库 / 编辑器
中间：预览
右侧：上下文工具面板
  1. Share
     - 快速分享
     - 下载/导出
     - 复制到平台
     - 分享前检查
  2. Style
     - 主题
     - 尺寸
     - 模板
  3. Document
     - 元数据
     - 标签
     - 版本
     - 资产
```

在窄屏上建议改成底部 tabs：

```text
编辑 | 预览 | 分享 | 文档
```

---

## 7. 推荐里程碑

### Milestone 2.1：本地文档库与导入导出基础

**目标：** 先解决“多文档”和“可携带”的基础。

功能：

- IndexedDB 文档库。
- 文档列表、搜索、标签、删除/恢复。
- `.md` 导入/导出。
- `.sharkdown` 工程包 v1。
- 文档库备份/恢复。
- 旧 localStorage 状态迁移。

验收：

- 用户可以维护多篇文档。
- 发给别人 `.sharkdown` 后可完整恢复编辑。
- 当前单文档体验不退化。

建议工期：3-5 个实现批次。

### Milestone 2.2：自包含分享页与平台复制

**目标：** 解决“发给别人直接看”和“复制到别的平台”。

功能：

- 自包含 HTML 导出。
- HTML 片段复制。
- 富文本剪贴板。
- 分享前检查。
- 阅读模式。
- 代码块复制与图片灯箱。

验收：

- HTML 文件断网可打开。
- 复制到富文本编辑器保留主要样式。
- 用户清楚知道导出文件包含哪些数据。

建议工期：3-4 个实现批次。

### Milestone 2.3：轻链接、二维码与原生分享

**目标：** 提供快速转发路径。

功能：

- 压缩 URL fragment 分享。
- 二维码生成。
- Web Share API 分享。
- 加密轻链接。
- 超长内容 fallback。

验收：

- 短文档可通过链接/二维码跨设备恢复。
- 超长文档不会生成不可用链接。
- 加密链接需要口令才能恢复。

建议工期：2-3 个实现批次。

### Milestone 2.4：模板、幻灯片与书籍模式

**目标：** 扩大 Share Markdown 的场景覆盖。

功能：

- 20 个内置分享模板。
- 自定义模板保存/导入/导出。
- 幻灯片模式。
- 书籍 collection。
- 多格式批量导出。

验收：

- 同一份 Markdown 可快速变成卡片、长文、slides。
- collection 可导出完整阅读包。

建议工期：4-6 个实现批次。

### Milestone 2.5：PWA、本地文件流与版本历史

**目标：** 把产品体验打磨成本地工具。

功能：

- PWA 安装与离线缓存。
- 本地文件打开/保存。
- 自动快照、手动快照、版本恢复。
- 分享记录。
- 本地批注。
- 隐私与存储管理。

验收：

- 断网可打开应用并继续编辑现有文档。
- 用户可回滚发布前版本。
- 用户可清楚管理本地存储占用。

建议工期：4-5 个实现批次。

---

## 8. 技术架构建议

### 8.1 新增模块

```text
src/
  library/
    documentStore.ts        IndexedDB 文档库
    documentIndex.ts        搜索和标签索引
    migrations.ts           旧 localStorage 到文档库迁移
    assets.ts               本地图片引用计数和清理
  share/
    artifacts.ts            分享物统一类型
    exportProject.ts        .sharkdown 工程包导出
    importProject.ts        .sharkdown 工程包导入
    exportHtml.ts           自包含 HTML 导出
    urlShare.ts             URL fragment 分享
    nativeShare.ts          Web Share API 封装
    clipboardFormats.ts     Markdown/HTML/纯文本/图片剪贴板
    privacyScan.ts          分享前隐私检查
  templates/
    presets.ts              内置模板
    templateStore.ts        自定义模板
  pwa/
    registerServiceWorker.ts
    updatePrompt.ts
  versioning/
    snapshots.ts
    diff.ts
```

### 8.2 状态管理拆分

当前 Zustand store 可继续用于 UI 当前状态，但不应承担完整文档库职责。

建议拆分：

- `useEditorStore`：当前编辑状态。
- `useLibraryStore`：文档列表、当前文档 ID、搜索条件。
- `useShareStore`：当前分享流程、导出状态、检查结果。
- IndexedDB service：真实持久化层。

### 8.3 Share Artifact 抽象

所有分享行为先生成 Artifact，再决定复制、下载或系统分享。

```ts
interface ShareArtifact {
  id: string;
  kind: ShareArtifactKind;
  fileName: string;
  mimeType: string;
  size: number;
  blob?: Blob;
  text?: string;
  metadata: {
    title: string;
    includesSourceMarkdown: boolean;
    includesLocalAssets: boolean;
    encrypted: boolean;
    createdAt: string;
  };
}
```

这样可以避免每个按钮各自实现导出逻辑，也方便做分享前检查和测试。

### 8.4 兼容策略

| 能力 | 主路径 | fallback |
|---|---|---|
| 文档库 | IndexedDB | localStorage 保存当前文档 |
| 本地文件保存 | File System Access API | Blob 下载 |
| 系统分享 | Web Share API | 复制/下载 |
| URL 压缩 | CompressionStream | JS 压缩库或禁用 |
| 私密包 | Web Crypto API | 禁用加密导出 |
| 离线运行 | Service Worker | 在线静态页 |

---

## 9. 数据格式版本策略

Phase 2 必须引入版本化数据格式，避免未来无法迁移。

### 9.1 数据版本

- `libraryVersion`: 文档库 schema 版本。
- `projectVersion`: `.sharkdown` 工程包版本。
- `templateVersion`: 模板版本。
- `artifactVersion`: 自包含 HTML 内嵌元数据版本。

### 9.2 迁移原则

- 新版本必须能读取上一个主版本。
- 导入未知高版本时不强行打开，提示升级 Sharkdown。
- 导出时写入 `createdBy`、`createdAt`、`appVersion`。
- 所有迁移函数必须可重复执行且有测试。

---

## 10. 测试策略

### 10.1 单元测试

- 文档库 CRUD。
- 搜索索引。
- `.sharkdown` manifest 生成与解析。
- asset 引用计数。
- 自包含 HTML 内容完整性。
- URL payload 压缩/解压。
- 加密/解密失败路径。
- 隐私扫描规则。
- Share Artifact 元数据。

### 10.2 组件测试

- 文档库列表。
- 分享面板。
- 模板选择器。
- 版本历史面板。
- 导入冲突对话框。
- 分享前检查结果。

### 10.3 Playwright 验收

- 首次打开后创建多篇文档。
- 插入本地图片后导出 `.sharkdown`，重新导入仍显示图片。
- 导出 HTML 后在新页面断网打开。
- 短文档生成 URL，在新标签恢复。
- PDF/图片导出不回归。
- PWA 离线刷新可进入应用。

---

## 11. 风险与规避

| 风险 | 影响 | 规避 |
|---|---|---|
| IndexedDB 数据结构膨胀 | 后期迁移困难 | 从第一版文档库开始做 schema version |
| URL 分享过长 | 聊天软件截断或浏览器拒绝 | 设置长度阈值，超限转工程包/HTML |
| 自包含 HTML 体积过大 | 邮件/聊天发送失败 | 显示体积估算，提供不含源 Markdown 模式 |
| 加密实现误用 | 用户误以为绝对安全 | 使用 Web Crypto 标准 API，明确口令丢失无法恢复 |
| PWA 缓存旧版本 | 用户长期卡旧构建 | 实现版本检查和刷新提示 |
| File System Access 兼容性 | Safari/Firefox 功能缺失 | 所有文件能力提供下载/上传 fallback |
| 平台复制差异 | Notion/公众号等表现不一 | 建立平台模式和测试样例，不承诺像素级一致 |
| 多文档库 UI 复杂 | 右侧面板拥挤 | 文档库可折叠，移动端使用底部 tabs |
| 模板过多导致选择困难 | 用户找不到入口 | 按“分享到哪里/做什么”组织模板 |

---

## 12. 不建议在 Phase 2 做的事

- 不做账号系统。
- 不做自有云同步。
- 不做多人实时协作。
- 不做服务端 Puppeteer 渲染。
- 不做数据库后端。
- 不做在线权限控制。
- 不做外部平台 OAuth 发布。
- 不做 AI 生成内容接口。
- 不做复杂插件市场。

这些能力会破坏“离线静态网页”定位，或显著增加安全、运维、隐私和兼容成本。可以在 Phase 3 另行设计“可选自托管同步/渲染服务”，但不应进入 Phase 2。

---

## 13. 成功指标

### 13.1 产品指标

- 用户可以用 Sharkdown 管理至少 100 篇本地 Markdown。
- 用户可以在 30 秒内把当前文档导出为适合发送给普通人的 HTML/PDF/图片。
- 用户可以在 30 秒内把当前文档导出为适合继续编辑的 `.sharkdown` 包。
- 用户可以对短内容生成链接或二维码并在另一设备恢复。
- 用户可以断网继续打开应用、编辑已有文档、导出本地文件。

### 13.2 质量指标

- 所有新增核心数据格式有单元测试。
- 所有导入路径有损坏文件/版本不匹配/资产缺失测试。
- 所有分享出口都有隐私元数据。
- 现有图片导出和 PDF 导出测试不回归。
- GitHub Pages 部署仍为纯静态产物。

---

## 14. 推荐执行顺序

优先级排序如下：

1. **文档库 + `.sharkdown` 工程包**：这是 Share Markdown 的根基，先解决源内容可携带。
2. **自包含 HTML + HTML 片段复制**：解决发给普通读者和外部平台。
3. **分享前检查 + 隐私说明**：防止源文档、图片、敏感内容被误发。
4. **URL 轻分享 + QR + Web Share**：提升即时转发体验。
5. **模板体系**：扩宽使用场景。
6. **阅读/书籍/幻灯片**：提高内容消费和演示能力。
7. **PWA + 本地文件流 + 版本历史**：打磨成本地工具。

如果只能做一个最小二阶段版本，建议范围是：

- IndexedDB 多文档库。
- `.sharkdown` 导入/导出。
- 自包含 HTML 导出。
- HTML/Markdown/纯文本复制。
- 分享前检查。
- 10 个场景模板。

这个最小版本已经能明显把产品从“导出工具”推进到“分享工作台”。

---

## 15. 资料来源

- HackMD Overview: https://hackmd.io/?nav=overview
- StackEdit: https://stackedit.io/
- HedgeDoc: https://hedgedoc.org/
- MDN Web Share API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API
- MDN File System API: https://developer.mozilla.org/en-US/docs/Web/API/File_System_API
- MDN IndexedDB API: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- MDN PWA offline/background operation: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation
- MDN Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- MDN CompressionStream: https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream

