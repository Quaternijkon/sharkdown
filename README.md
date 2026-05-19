# Sharkdown

Sharkdown 是一个纯静态、离线优先的 **share markdown！** 工作台。它把 Markdown 转换成适合社交媒体、文档、图片、PDF、HTML 和本地备份的分享产物。所有编辑、渲染、分析、打包和导出都在当前浏览器中完成，不依赖后端、账号、云同步、遥测或上传流程。

当前版本：`1.4.2`。

## 核心能力

- 三栏工作台：左侧 Markdown 编辑，中间实时预览，右侧 VS Code 风格活动侧栏。
- 可调列宽：桌面端可拖拽编辑器、预览、右侧栏之间的分隔条。
- 在线 Markdown 编辑器：基于 `@uiw/react-md-editor`，提供固定浮动格式工具栏；Sharkdown 只保留文档动作按钮，如恢复示例、插入本地图片、复制、清空。
- 编辑右键菜单：在编辑区右键会打开 Sharkdown 的 Markdown 菜单，可插入常用语法模板并调用格式命令，不触发浏览器默认菜单。
- 本地图片：粘贴或选择图片后以 `local-image://` 短引用插入，Blob 存在浏览器 IndexedDB 中。
- 外观主题：Claude 暖纸、GPT 黑白灰、Apple 艺术、Google 四元色、WeChat 清绿、Douyin 霓虹、黑黄会心一笑、GitHub、纸张。
- 独立分析评估页：统计语法覆盖、代码语言、章节占比、任务完成度、阅读时间、结构清晰度、内容完整度、分享可用性等离线指标。
- 本地文档库：浏览器缓存中的轻量文档管理、虚拟文件树、搜索、标签、归档、未保存提示、JSON 备份导出和导入。
- Convert 工作区：围绕分享目标生成图片、HTML 片段、富文本、Markdown、纯文本、PDF、ZIP 和 `.sharkdown` 工程包。
- 导出格式：PNG/JPEG/WebP/SVG、长图切片 PNG、文字版 PDF 打印、HTML、HTML fragment、rich text、Markdown、plain text、ZIP。
- PWA 静态壳：首次在线打开后可缓存应用壳，支持离线重新打开。

## 技术栈

- Vite + React + TypeScript
- Tailwind CSS + `@tailwindcss/typography`
- `@uiw/react-md-editor`
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

开发服务器默认监听 `http://127.0.0.1:5173`。生产构建产物在 `dist/`，可直接作为静态站点部署到 GitHub Pages、Cloudflare Pages 或任意静态托管服务。

## 项目结构

```text
src/
  app/                       页面编排、导出动作、状态提示、页眉入口
  components/editor/         Markdown 编辑器、本地图片插入、文档动作
  components/preview/        Markdown 预览、导出目标 DOM
  components/controls/       主题、画布尺寸和模板控制
  components/workspace/      三栏布局、右侧活动栏、列宽约束
  components/convert/        Convert 工作区、平台预设、预检和轮播拆分
  components/library/        本地文档库、虚拟文件树、备份导入导出
  components/analysis/       离线 Markdown 分析评估面板
  markdown/                  Markdown 渲染、Shiki 代码块、Mermaid、sanitize schema
  export/                    图片/PDF/ZIP/切片/剪贴板导出工具
  share/                     .sharkdown、HTML、URL fragment、隐私扫描、剪贴板格式
  themes/                    主题预设和预览 CSS
  store/                     Zustand + localStorage 持久化
  utils/                     下载、存储、本地图片工具
tests/
  export.spec.ts             Playwright 页面与导出回归
```

核心导出路径：

```text
Markdown -> PreviewFrame -> waitForPreviewReady()
-> convert/share/export artifact -> download / clipboard / print
```

## 隐私模型

Sharkdown 没有自有后端。Markdown、主题设置、文档库、模板、本地图片 Blob 和导出结果都留在当前浏览器中。只有当用户主动下载、复制、调用系统分享或生成 URL fragment 时，内容才会离开当前页面。

URL fragment 不会作为 HTTP 请求路径发送给服务器，但浏览器历史、聊天软件和截图仍可能记录完整链接。敏感内容建议使用 `.sharkdown` 工程包或自包含 HTML，并在发送前查看“分享前检查”结果。

## 浏览器限制

- 远程图片如果没有正确 CORS 响应头，浏览器会阻止 canvas 导出。推荐下载图片后用本地图片插入。
- 剪贴板图片写入主要在 Chromium 系浏览器可用；不可用时会自动下载 PNG。
- 超长内容可能触发浏览器 canvas 尺寸或内存上限。当前提供长图切片 PNG、文字版 PDF 和 HTML 交付路径。
- Raw HTML 默认关闭；开启后仍会经过 `rehype-sanitize` 清洗。
- 文档库备份只能打包当前浏览器 IndexedDB 中仍可读取的 `local-image://` 资源。
- Service Worker 缓存的是静态应用壳和同源静态资源，不同步或上传用户文档。

## 测试

```bash
npm test
npm run lint
npm run build
npx playwright test
```

单元测试覆盖主题预设、Markdown 渲染、代码高亮、导出选项、本地图片、文档库、分析算法、分享包、PWA 策略、编辑器工具栏和右键菜单等。Playwright 测试覆盖页面加载、预览渲染、公式、Mermaid、Convert 工作区和导出按钮。

## 版本维护

版本以 `package.json`、`package-lock.json` 和 `src/version.ts` 为准。每次功能更新需要同步维护：

- `package.json` 和 `package-lock.json` 的版本号；
- `src/version.ts` 的 `APP_VERSION` 和 `APP_RELEASE_DATE`；
- `CHANGELOG.md` 的版本记录；
- README 的功能范围、架构说明、浏览器限制和测试说明。

版本策略：

- 修复导出错误、样式错位、兼容性问题：递增 patch，例如 `1.3.1`。
- 增加新的转换格式、平台预设、重要 UI 工作流：递增 minor，例如 `1.4.0`。
- 破坏 `.sharkdown`、文档库、模板或导出 manifest 兼容性：递增 major，并在 changelog 写清迁移方式。

完整记录见 [CHANGELOG.md](CHANGELOG.md)。
