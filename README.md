# Sharkdown

Sharkdown 是一个纯静态的 Markdown 转图片工具。用户在浏览器里粘贴或编辑 Markdown，右侧实时预览，并可导出 PNG、JPEG、SVG，或复制 PNG 图片到剪贴板。用户内容不上传，所有渲染和导出都在本地浏览器完成。

## 功能范围

- Markdown 编辑与实时预览。
- GitHub Flavored Markdown：表格、任务列表、删除线、链接。
- KaTeX 数学公式。
- Mermaid 图表。
- Shiki 懒加载代码高亮。
- 6 个主题：GitHub、暗色、纸张、极简、科技、学术。
- 宽度、边距、圆角、背景、字号、像素倍率设置。
- PNG/JPEG/SVG 下载、PNG 剪贴板复制、长图切片 PNG 下载。
- localStorage 自动保存最近内容和设置。
- 本地图片读取为 data URL 后插入 Markdown。

## 技术栈

- Vite + React + TypeScript
- Tailwind CSS + `@tailwindcss/typography`
- `react-markdown`、`remark-gfm`、`remark-math`
- `rehype-katex`、`rehype-raw`、`rehype-sanitize`
- `html-to-image`
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
  components/editor/MarkdownEditor.tsx 编辑器、复制 Markdown、本地图片插入
  components/preview/PreviewFrame.tsx  固定宽度预览和导出目标节点
  components/controls/                 主题、画布、导出控制
  markdown/                            react-markdown 渲染、Shiki、Mermaid、sanitize schema
  export/                              html-to-image 导出、剪贴板、等待资源、切片
  themes/                              主题预设和导出样式
  store/                               Zustand + localStorage 持久化
  utils/                               下载、存储、本地图片工具
  tests/fixtures/                      Markdown 回归样例
tests/export.spec.ts                   Playwright 页面回归
```

核心导出路径是：

```text
Markdown -> MarkdownRenderer -> PreviewFrame -> waitForPreviewReady()
-> html-to-image Blob -> download / clipboard / sliced PNG
```

`waitForPreviewReady()` 会在导出前等待字体、图片、Mermaid 渲染和下一帧布局。如果内容高度超过浏览器稳定导出的建议上限，会提示使用切片导出。

## 隐私模型

Sharkdown 不包含服务端请求逻辑。Markdown、图片 data URL、主题设置和导出结果都停留在当前浏览器中。localStorage 只保存用户的最近内容和设置。

## 浏览器限制

- 远程图片如果没有正确 CORS 头，浏览器会阻止 canvas 导出。推荐下载图片后用本地图片插入。
- 剪贴板图片写入主要在 Chromium 系浏览器可用；不可用时会自动下载 PNG。
- 超长内容可能触发浏览器 canvas 尺寸或内存上限。当前版本提供切片 PNG，后续可接 Playwright/Puppeteer 服务端兜底。
- Raw HTML 默认关闭；开启后仍会经过 `rehype-sanitize` 清洗。

## 测试

单元测试覆盖主题预设、localStorage 容错、导出前资源等待和 Blob 导出选项：

```bash
npm test
```

Playwright 测试覆盖页面加载、预览渲染、公式、Mermaid 和导出按钮：

```bash
npx playwright test
```
