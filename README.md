# Sharkdown

Sharkdown 是一个纯静态、离线优先的 **Share Markdown / Convert Markdown 工作台**。用户在浏览器里编辑 Markdown，实时预览排版效果，并把内容交付为社交媒体图片、轮播卡片素材、文字版 PDF、自包含 HTML、目标 HTML 片段、纯 Markdown、轻量分享链接、批量 ZIP 包或 `.sharkdown` 可继续编辑工程包。用户内容不上传，所有渲染、检查、打包和导出都在本地浏览器完成。

## 功能范围

- Markdown 富编辑：基于 `@uiw/react-md-editor`，支持直接在线编写、紧凑格式工具栏、选中文本右键快捷格式化，以及继续保留本地图片短引用插入。
- 本地文档库：多文档保存、当前文档状态、标题与标签编辑、未保存提示、搜索、复制、归档、恢复、包含本地图片资产的整库 JSON 备份导出和合并导入。
- 轻量虚拟文件树：支持本地浏览器缓存中的虚拟文件夹、嵌套层级、折叠、按选中文件夹新建、文件夹重命名、安全移除文件夹、文档移动到指定文件夹，以及按文件夹名搜索。
- 离线 Markdown 分析：识别语法使用情况、代码块语言、章节占比、任务完成度，并给出结构清晰度、内容完整度和可视化潜力等本地启发式评分。
- GitHub Flavored Markdown：表格、任务列表、删除线、链接。
- KaTeX 数学公式。
- Mermaid 图表。
- Shiki 懒加载代码高亮。
- 经典主题：Claude 暖纸、GPT 黑白灰、Apple、Google、WeChat、Douyin、黑黄、GitHub、纸张。
- 宽度、边距、圆角、背景、字号、像素倍率设置。
- PNG/JPEG/WebP/SVG 下载、PNG 剪贴板复制、长图切片 PNG 下载；图片导出会使用当前预览节点的实际背景，保证深色主题导出与渲染效果一致。
- Convert 工作区：围绕转换目标展示推荐格式、预检建议和一键交付动作。
- 平台转换预设：微信公众号、小红书图文、抖音竖屏、知乎长文、GitHub README、Notion/知识库、邮件正文、轮播/幻灯片、打印/PDF 和通用转换。
- Markdown 轮播拆分：支持显式 `---` 分隔和二级标题切分，并提示超长卡片。
- 目标 HTML 片段与富文本复制：按目标清洗脚本、事件属性和不适合邮件的 class。
- 批量导出 ZIP 包：包含 manifest、Markdown 源文档、纯文本、HTML 片段和预览 PNG。
- 文字版 PDF 打印导出：保留可选择文本、目录链接、页眉页脚和页边距设置。
- PDF profile：A4 正式文档、移动阅读、讲义，并且这些设置只出现在 PDF 分支下。
- 目标预检诊断：提示远程图片、卡片过长、本地资产过大、宽表格、raw HTML、公式、Mermaid 和疑似敏感内容。
- `.sharkdown` 工程包导入/导出：保留 Markdown、主题、尺寸设置和本地图片资产。
- 自包含 HTML 导出：把当前预览、主题样式和可选源 Markdown 打包成单个 HTML 文件。
- URL fragment 轻量分享：短文档可生成可复制链接，不经过自有服务器。
- 富文本/纯文本/Markdown 剪贴板复制。
- 分享前检查：提示本地图片、远程图片、raw HTML、疑似邮箱/手机号/token 和超长 URL 风险。
- 11 个内置分享模板：社交卡片、引用卡、README、接口说明、会议纪要、产品更新、学习笔记、长文、幻灯片、邮件正文、发布说明。
- PWA 静态壳：首次在线打开后可缓存应用壳，支持离线重新打开。
- 本地图片以 `local-image://` 短引用插入，图片 Blob 存储在浏览器 IndexedDB；文档库备份会尽量打包这些引用到的本地图片资产，便于本地备份和设备迁移。

## 技术栈

- Vite + React + TypeScript
- Tailwind CSS + `@tailwindcss/typography`
- `react-markdown`、`remark-gfm`、`remark-math`
- `rehype-katex`、`rehype-raw`、`rehype-sanitize`
- `html-to-image`
- `fflate`
- Mermaid
- Shiki
- Zustand
- Vitest + Playwright

## 开发命令

```bash
npm install
npm run dev
npm test
npm run build
npm run lint
npx playwright test
```

开发服务器默认监听 `http://127.0.0.1:5173`。生产构建产物在 `dist/`，可直接作为静态站部署。

## 架构

```text
src/
  app/App.tsx                         页面编排、导出动作、状态反馈
  components/convert/                 Convert 工作区、平台预设、轮播拆分、预检建议
  components/editor/MarkdownEditor.tsx 富 Markdown 编辑器、工具栏、右键格式菜单、本地图片插入
  components/library/DocumentLibraryPanel.tsx 本地文档库、虚拟文件树、备份导入导出
  components/analysis/MarkdownAnalysisPanel.tsx 离线 Markdown 分析视图
  components/preview/PreviewFrame.tsx  固定宽度预览和导出目标节点
  components/share/SharePanel.tsx       工程包、HTML、链接、剪贴板和分享检查
  components/templates/TemplatePanel.tsx 分享场景模板
  components/controls/                 主题、画布、导出控制
  convert/                             转换制品模型、平台预设、分段、HTML 片段、预检
  analysis/                            语法、代码语言、任务、章节和评分的离线分析算法
  library/                              本地文档库、虚拟文件夹、备份导入导出、未保存检测和 Zustand 包装
  markdown/                            react-markdown 渲染、Shiki、Mermaid、sanitize schema、编辑命令
  export/                              html-to-image 导出、剪贴板、等待资源、切片、PDF profiles、批量 ZIP
  share/                               .sharkdown、HTML、URL、隐私扫描、剪贴板格式
  templates/                           内置分享模板
  pwa/                                 Service Worker 注册
  themes/                              主题预设和导出样式
  store/                               Zustand + localStorage 持久化
  utils/                               下载、存储、本地图片工具
  tests/fixtures/                      Markdown 回归样例
tests/export.spec.ts                   Playwright 页面回归
```

核心导出路径是：

```text
Markdown -> MarkdownRenderer -> PreviewFrame -> waitForPreviewReady()
-> convert/share/export artifact -> download / clipboard / native share / print
```

`waitForPreviewReady()` 会在导出前等待字体、图片、Mermaid 渲染和下一帧布局。如果内容高度超过浏览器稳定导出的建议上限，会提示使用切片导出。

## 隐私模型

Sharkdown 不包含自有后端请求逻辑。Markdown、主题设置、文档库、分享模板和导出结果都停留在当前浏览器中；本地图片 Blob 存储在 IndexedDB。文档库备份和 `.sharkdown` 工程包会把用户主动引用的本地图片写入下载文件，便于离线迁移。所有“分享”动作都是用户主动触发的复制、下载、系统分享或 URL fragment 生成。

需要注意：URL fragment 不会作为 HTTP 请求路径发送给服务器，但浏览器历史、聊天软件和截图仍可能记录完整链接。敏感内容建议使用 `.sharkdown` 文件或自包含 HTML，并在发送前查看“分享前检查”结果。

## 浏览器限制

- 远程图片如果没有正确 CORS 头，浏览器会阻止 canvas 导出。推荐下载图片后用本地图片插入。
- 剪贴板图片写入主要在 Chromium 系浏览器可用；不可用时会自动下载 PNG。
- 超长内容可能触发浏览器 canvas 尺寸或内存上限。当前版本提供切片 PNG，并保留文字版 PDF 和 HTML 交付路径。
- Raw HTML 默认关闭；开启后仍会经过 `rehype-sanitize` 清洗。
- 文档库备份只能打包当前浏览器 IndexedDB 中仍可读取的 `local-image://` 资产；如果浏览器缓存已清理，Markdown 文本仍会保留，但对应图片无法从备份中恢复。
- Service Worker 缓存的是静态应用壳和同源静态资源，不同步或上传用户文档。

## 测试

单元测试覆盖主题预设、localStorage 容错、本地图片、导出前资源等待、图片/PDF 导出选项、导出背景一致性、Markdown 编辑命令、离线分析算法、分享包、HTML 交付物、URL 分享、隐私扫描、文档库、虚拟文件树、模板和 PWA 注册：

```bash
npm test
```

Playwright 测试覆盖页面加载、预览渲染、公式、Mermaid、Convert 工作区和导出按钮：

```bash
npx playwright test
```

## 版本与更新记录

当前版本：`1.1.0`。版本以 `package.json` 和 `src/version.ts` 为准。每次功能更新必须同步维护：

- `package.json` 和 `package-lock.json` 的版本号。
- `src/version.ts` 的 `APP_VERSION` 与 `APP_RELEASE_DATE`。
- `CHANGELOG.md` 的版本更新记录。
- README 的功能范围、架构说明、浏览器限制和测试说明。

版本策略：

- 修复导出错误、样式错位、兼容性问题：递增 patch，例如 `1.1.1`。
- 增加新的转换格式、平台预设、批量导出、重要 UI 工作流：递增 minor，例如 `1.2.0`。
- 破坏 `.sharkdown`、文档库、模板或导出 manifest 的兼容性：递增 major，并在 changelog 写清楚迁移方式。

完整记录见 [CHANGELOG.md](CHANGELOG.md)。

下一阶段的 Convert 能力增强计划见 [docs/superpowers/plans/2026-05-15-convert-phase3.md](docs/superpowers/plans/2026-05-15-convert-phase3.md)。
