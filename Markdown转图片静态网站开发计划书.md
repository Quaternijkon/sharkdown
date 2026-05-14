# Markdown 转图片静态网站开发计划书

**调研日期：2026-05-14**  
**目标读者：构建项目的前端/全栈 Agent**  
**项目目标：开发一个纯静态网站，让用户粘贴 AI 生成的 Markdown，实时预览并导出为高质量图片。**

## 1. 结论先行

本项目不建议从零实现 Markdown 解析、代码高亮、公式、图表和 DOM 截图。最短路径是采用成熟开源组件和现成项目经验：

1. **应用形态**：Vite + React + TypeScript + Tailwind CSS 的纯静态站。
2. **优先参考/二开项目**：`alterem/mark-pic`，它已经覆盖实时预览、自定义样式和一键导出；同时参考 `gcui-art/markdown-to-image` 的海报模板和组件化设计。
3. **Markdown 渲染**：React 技术栈下优先使用 `react-markdown + remark-gfm + remark-math + rehype-katex + rehype-sanitize`。
4. **图片导出**：前端首选 `html-to-image`，输出 PNG/JPEG/SVG/Blob；保留 `dom-to-image-more` 作为备选适配层。`html2canvas` 只作为兼容性备选，不作为主路径。
5. **代码高亮**：高质量版本使用 Shiki；MVP 可先用轻量方案，但最终建议懒加载 Shiki。
6. **扩展能力**：公式用 KaTeX，流程图/时序图用 Mermaid，主题用 Tailwind CSS + CSS Variables。
7. **服务端兜底**：静态站足够完成 MVP；当遇到超长图、跨域图片、批量导出、API 集成时，再增加 Playwright/Puppeteer 渲染服务。

## 2. 产品范围

### 2.1 MVP 必做能力

- 粘贴/编辑 Markdown。
- 实时预览。
- 支持 GitHub Flavored Markdown：表格、任务列表、删除线、自动链接。
- 支持代码块高亮。
- 支持中文、中英混排和 Emoji。
- 支持多主题：GitHub、暗色、纸张、极简、科技、学术。
- 支持导出 PNG、JPEG，最好同时支持 SVG。
- 支持复制图片到剪贴板。
- 支持宽度、边距、圆角、背景、字体大小、像素倍率设置。
- 全部在浏览器本地处理，不上传用户内容。

### 2.2 建议增强能力

- KaTeX 数学公式。
- Mermaid 图表。
- 长图导出与分页/切片导出。
- 本地图片上传、拖拽插入、图片内联处理。
- 主题导入/导出 JSON。
- 最近使用内容保存在 localStorage/IndexedDB。
- 导出 WebP、PDF 或多张图片。
- 批量导出接口：作为后续服务端方案。

## 3. 技术选型矩阵

| 模块 | 推荐技术 | 成熟度判断 | 采用建议 |
|---|---|---|---|
| 构建与部署 | Vite + React + TypeScript | Vite 官方支持静态部署；React 生态成熟 | 必选 |
| UI 样式 | Tailwind CSS + @tailwindcss/typography | Typography 插件专为 Markdown/CMS HTML 默认排版设计 | 必选 |
| 编辑器 | @uiw/react-md-editor | React/TypeScript Markdown 编辑器，集成快 | MVP 必选 |
| Markdown 渲染 | react-markdown | 基于 unified/remark/rehype，安全和插件化好 | 必选 |
| GFM | remark-gfm | 支持表格、任务列表等 AI 输出常见语法 | 必选 |
| 数学公式 | remark-math + rehype-katex + KaTeX | KaTeX 同步渲染、前端友好 | 增强必选 |
| 图表 | Mermaid | 文本生成图表，适配 AI 生成内容 | 增强必选 |
| 代码高亮 | Shiki | 接近 VS Code 的高亮质量，适合分享图 | 推荐 |
| 安全清洗 | rehype-sanitize / DOMPurify | 用户输入场景必须有 XSS 防护 | 必选 |
| 图片导出 | html-to-image | 维护活跃，输出形态多，DOM 到图片主路径 | 必选 |
| 导出备选 | dom-to-image-more | 对 dom-to-image 做修复增强，可用于兼容兜底 | 备选 |
| 旧方案兼容 | html2canvas | 生态大，但不是实际截图，复杂样式可能有差异 | 不做主路径 |
| 服务端兜底 | Playwright / Puppeteer | 对 fullPage/元素截图成熟，适合长图和 API | 二期 |

## 4. 现成项目利用策略

### 4.1 首选参考项目：alterem/mark-pic

适合直接学习或二开，因为它已经是“Markdown 转图片静态工具”的完整形态：编辑器、预览、控制面板、导出、React/TypeScript/Tailwind、Mermaid、KaTeX、html-to-image 都在类似范围内。

Agent 执行策略：

1. 先拉取或阅读该项目结构。
2. 保留其功能分层思路：Editor、Preview、ControlPanel、Export。
3. 不必逐行复刻，直接按本计划书的组件边界重建或二开。
4. 注意该项目体量较小，不能把它当作唯一权威，需要结合 html-to-image、react-markdown、Shiki、KaTeX、Mermaid 官方实践补强。

### 4.2 模板参考项目：gcui-art/markdown-to-image

适合学习“海报模板化”和“组件化导出”的思路。它的价值不只是导出图片，而是把 Markdown 转为适合社交传播的视觉卡片。

Agent 执行策略：

1. 参考其模板和主题概念。
2. 复用“Web Editor + React Component”的产品形态。
3. 不建议完全依赖其包名或内部 API，先验证当前仓库和 npm 包是否一致。

### 4.3 不适合作为静态 MVP 主路径：markdown-to-image-serve

它基于 Next.js + Puppeteer，更适合作为服务端 API、Docker 部署、批量导出和长图兜底，不适合第一版“纯静态站”。

## 5. 推荐架构

```text
用户粘贴 Markdown
        ↓
EditorState：内容、主题、尺寸、导出参数
        ↓
MarkdownRenderer：GFM / Math / Mermaid / Code Highlight / Sanitize
        ↓
PreviewFrame：固定宽度容器 + CSS Variables 主题
        ↓
ExportController：等待字体、图片、Mermaid 渲染完成
        ↓
html-to-image.toBlob / toPng / toJpeg / toSvg
        ↓
下载 / 复制到剪贴板 / 保存历史
```

### 5.1 建议目录结构

```text
src/
  app/
    App.tsx
    routes.tsx
  components/
    editor/MarkdownEditor.tsx
    preview/PreviewFrame.tsx
    preview/MarkdownRenderer.tsx
    controls/ThemePanel.tsx
    controls/ExportPanel.tsx
    controls/SizePanel.tsx
    common/Toolbar.tsx
  export/
    exportImage.ts
    waitForAssets.ts
    clipboard.ts
    sliceLongImage.ts
  markdown/
    plugins.ts
    MermaidBlock.tsx
    CodeBlock.tsx
    sanitizeSchema.ts
  themes/
    presets.ts
    theme.css
  store/
    useEditorStore.ts
  utils/
    download.ts
    imageInline.ts
    storage.ts
  tests/
    fixtures/
```

### 5.2 核心数据结构

```ts
export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'webp';

export interface DocumentState {
  markdown: string;
  themeId: string;
  width: number;
  padding: number;
  radius: number;
  fontScale: number;
  pixelRatio: number;
  background: string;
  allowRawHtml: boolean;
}

export interface ThemePreset {
  id: string;
  name: string;
  cssVars: Record<string, string>;
  proseClassName?: string;
}
```

## 6. 关键实现规范

### 6.1 Markdown 渲染规范

- 默认不允许原生 HTML。
- 如必须允许 HTML：使用 `rehype-raw` 后必须接 `rehype-sanitize` 或 DOMPurify。
- GFM 必开：AI 输出常见表格、任务列表、删除线。
- 数学公式：`remark-math + rehype-katex`。
- Mermaid：不要让 react-markdown 直接注入脚本；将 ```mermaid 代码块映射到受控 MermaidBlock 组件。
- 代码高亮：优先 Shiki，按语言和主题懒加载，避免初始包过大。

### 6.2 图片导出规范

导出前必须等待：

1. React 渲染完成。
2. `document.fonts.ready`。
3. 预览区所有图片加载完成。
4. Mermaid SVG 渲染完成。
5. KaTeX 样式已加载。

导出逻辑建议：

```ts
await waitForPreviewReady(previewElement);
const blob = await htmlToImage.toBlob(previewElement, {
  pixelRatio,
  cacheBust: true,
  backgroundColor,
  style: {
    transform: 'none',
  },
});
```

不要把大图导出主路径做成 `canvas.toDataURL()`，因为它会把整图编码成内存字符串，大图时更容易产生性能和内存问题。优先 `toBlob()`。

### 6.3 远程图片与 CORS

静态站无法强行突破浏览器跨域限制。处理策略：

- 推荐用户上传本地图片或粘贴 base64/data URL。
- 对 Markdown 中远程图片，尝试用 `crossOrigin='anonymous'` 加载。
- 如果远程服务器没有正确 CORS，导出可能失败；提示用户“下载图片后本地插入”或“启用服务端代理版本”。
- 后续服务端方案可增加白名单代理，将远程图片转为 Blob/data URL。

### 6.4 字体与中文支持

- 默认字体栈：`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`。
- 主题中可配置标题字体、正文字体、代码字体。
- 导出前等待 `document.fonts.ready`。
- 不要强依赖在线字体；静态站可提供可选本地字体包，但需控制体积。

### 6.5 长图策略

浏览器 Canvas 存在尺寸和内存上限，超长内容可能失败。MVP 做法：

- 提供最大高度检测。
- 超过阈值时提示“建议切片导出”。
- 实现按自然段/固定高度切片导出多张 PNG。
- 二期用 Playwright/Puppeteer 服务端 fullPage/元素截图兜底。

## 7. Agent 构建任务清单

### Phase A：项目初始化

- 创建 Vite + React + TypeScript 项目。
- 安装 Tailwind CSS、@tailwindcss/typography。
- 配置 ESLint、Prettier、TypeScript strict。
- 创建基础布局：左侧编辑器，右侧预览，右侧/顶部控制面板。

建议依赖：

```bash
pnpm add react-markdown remark-gfm remark-math rehype-katex rehype-sanitize rehype-raw
pnpm add html-to-image @uiw/react-md-editor mermaid shiki
pnpm add lucide-react zustand clsx tailwind-merge
pnpm add -D tailwindcss @tailwindcss/vite @tailwindcss/typography vitest playwright
```

### Phase B：Markdown 与预览

- 接入 @uiw/react-md-editor 或 textarea + toolbar。
- 创建 MarkdownRenderer。
- 支持 GFM、数学公式、代码块和 MermaidBlock。
- 创建 6 个主题预设。
- 预览区使用固定宽度容器，防止导出尺寸随机变化。

### Phase C：导出能力

- 实现 `waitForPreviewReady()`。
- 实现 `exportAsBlob(format)`。
- 实现下载 PNG/JPEG/SVG。
- 实现复制 PNG 到剪贴板。
- 实现导出进度、错误提示、重试。
- 对 CORS、字体、超长图给出明确错误信息。

### Phase D：产品可用性

- 增加示例 Markdown。
- 增加主题切换、尺寸预设和像素倍率。
- 增加 localStorage 自动保存。
- 增加“清空”“复制 Markdown”“复制图片”“下载图片”。
- 增加移动端适配：窄屏时上下布局。

### Phase E：质量与测试

- 用 Playwright 做截图回归测试。
- 建立 fixtures：长文、代码、表格、公式、Mermaid、中文、Emoji、远程图片。
- 测试 Chrome、Edge、Safari、Firefox。
- 验证导出 PNG 在微信、飞书、Notion、公众号编辑器中的显示效果。

## 8. 验收标准

### 8.1 功能验收

- 用户可以粘贴 Markdown 并立即看到预览。
- 常见 AI 输出格式能正确渲染：标题、列表、表格、代码块、引用、任务列表。
- 代码块有高亮且导出图片保持一致。
- 中文、英文、Emoji 不乱码。
- PNG/JPEG 导出清晰，2x 像素倍率可用。
- 复制图片到剪贴板在 Chromium 浏览器可用；不可用时降级为下载。
- 用户内容不离开浏览器。

### 8.2 质量验收

- 默认主题生成图片可直接用于社交分享或文档插图。
- 导出前不会出现字体未加载导致的布局跳动。
- 外部图片失败时有可理解提示。
- 长图失败时提供切片导出或后续服务端兜底说明。
- 主要逻辑有单元测试或组件测试，导出有 Playwright 回归用例。

## 9. 风险与规避

| 风险 | 影响 | 规避策略 |
|---|---|---|
| 跨域图片污染 Canvas | 无法导出图片 | 本地上传、data URL、CORS 提示、二期服务端代理 |
| 超长内容超出 Canvas 上限 | 导出失败或空白 | 高度检测、切片导出、服务端 Playwright 兜底 |
| 字体未加载 | 导出图和预览不一致 | 等待 document.fonts.ready，使用系统字体栈 |
| Mermaid 异步渲染未完成 | 图表缺失 | MermaidBlock 内部暴露 render promise，导出前等待 |
| Raw HTML XSS | 安全风险 | 默认关闭 raw HTML；开启时强制 sanitize |
| Shiki 包体过大 | 首屏慢 | 懒加载语言和主题，只内置常用语言 |
| 移动端内存不足 | 导出失败 | 限制 pixelRatio，提供较低清晰度选项 |

## 10. 二期服务端方案

当产品需要 API、批量生成、企业内部系统集成或稳定长图时，增加服务端渲染：

- 技术：Playwright 或 Puppeteer。
- 形式：Next.js/Node API 或独立 Docker 服务。
- 输入：Markdown、主题、尺寸、导出格式。
- 输出：PNG/JPEG/WebP/PDF。
- 安全：限制请求体大小、限制外链域名、限流、任务超时、隔离浏览器上下文。
- 用途：长图、复杂 Mermaid、跨域图片代理、批量导出。

## 11. 给构建 Agent 的直接指令

你是前端工程 Agent。请按以下要求构建项目：

1. 不要从零实现 Markdown parser、语法高亮、公式渲染、图表渲染、DOM 转图片。
2. 使用 Vite + React + TypeScript + Tailwind CSS 创建静态站。
3. 参考 alterem/mark-pic 的产品结构，参考 gcui-art/markdown-to-image 的模板/海报化思路。
4. Markdown 渲染使用 react-markdown 生态：remark-gfm、remark-math、rehype-katex、rehype-sanitize。
5. 图片导出首选 html-to-image，导出主路径使用 Blob，不要以 toDataURL 作为大图主路径。
6. 原生 HTML 默认关闭；如果提供开关，必须 sanitize。
7. 导出前必须等待字体、图片、KaTeX、Mermaid 渲染完成。
8. 需要实现错误提示：跨域图片、长图、剪贴板不可用、浏览器不支持。
9. 交付时包含 README、依赖列表、架构说明、开发脚本、测试 fixtures。
10. 首版只做静态站；服务端 Playwright/Puppeteer 作为后续可选模块，不阻塞 MVP。

## 12. 资料来源索引

见文末“资料来源”。

## 资料来源

- [S1] gcui-art/markdown-to-image GitHub: https://github.com/gcui-art/markdown-to-image — React 组件 + 内置 Web Editor；用于 Markdown 海报/社交图片；可一键部署。
- [S2] alterem/mark-pic GitHub: https://github.com/alterem/mark-pic — 现代 Markdown 转图片工具；实时预览、自定义样式、一键导出；React/TypeScript/Tailwind。
- [S3] wxingheng/markdown-to-image-serve GitHub: https://github.com/wxingheng/markdown-to-image-serve — Next.js + Puppeteer 的 Markdown 转图片服务；适合 API/Docker/服务端兜底。
- [S4] bubkoo/html-to-image GitHub: https://github.com/bubkoo/html-to-image — DOM 节点转 PNG/JPEG/SVG/Blob/Canvas；dom-to-image 的可维护分支。
- [S5] html-to-image npm: https://www.npmjs.com/package/html-to-image — npm 包说明：HTML5 Canvas + SVG 生成图片。
- [S6] dom-to-image-more GitHub: https://github.com/zm-develops/dom-to-image-more — DOM 节点转 SVG/PNG/JPEG；对原 dom-to-image 做修复增强。
- [S7] html2canvas official: https://html2canvas.github.io/html2canvas/ — 浏览器端 DOM 截图方案；不是实际截图，而是基于 DOM 信息重建。
- [S8] react-markdown GitHub: https://github.com/remarkjs/react-markdown — React Markdown 渲染组件；基于 unified/remark/rehype，强调安全和插件化。
- [S9] markdown-it npm: https://www.npmjs.com/package/markdown-it — CommonMark + 扩展语法，插件生态强，安全默认值。
- [S10] DOMPurify GitHub: https://github.com/cure53/DOMPurify — 清洗 HTML、MathML、SVG，防御 XSS。
- [S11] Shiki docs: https://shiki.style/guide/ — 基于 TextMate 语法、接近 VS Code 的代码高亮，可在浏览器/Node/Workers 运行。
- [S12] KaTeX official: https://katex.org/ — 快速同步渲染数学公式，适合前端公式排版。
- [S13] Mermaid official: https://mermaid.js.org/ — 用文本和代码创建图表与可视化。
- [S14] Vite static deploy: https://vite.dev/guide/static-deploy — Vite 构建产物可作为静态站部署。
- [S15] Tailwind Typography: https://github.com/tailwindlabs/tailwindcss-typography — 官方 prose 类，适合 Markdown/CMS HTML 的默认排版。
- [S16] Playwright screenshots: https://playwright.dev/docs/screenshots — 支持页面、元素和 fullPage 截图；适合作为服务端兜底。
- [S17] Puppeteer screenshots: https://pptr.dev/guides/screenshots — 支持 Page.screenshot 和 ElementHandle.screenshot；适合作为 API/批量导出方案。
- [S18] MDN Clipboard.write: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write — Clipboard API 常见支持写入文本、HTML、PNG 图片数据。
- [S19] MDN Canvas toDataURL: https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLCanvasElement/toDataURL — toDataURL 会把整图编码为内存字符串；大图建议优先 toBlob。
- [S20] MDN CSS Font Loading API: https://developer.mozilla.org/zh-CN/docs/Web/API/CSS_Font_Loading_API — document.fonts.ready 可等待字体加载和布局完成。
