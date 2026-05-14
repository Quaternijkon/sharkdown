# Markdown To Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static Vite + React + TypeScript app that previews Markdown and exports the rendered card as image files.

**Architecture:** Keep parsing/rendering, export orchestration, persistent editor state, and UI controls in separate modules. The preview node is the single export target; export code waits for fonts, images, and Mermaid rendering before producing blobs.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, react-markdown, remark/rehype plugins, KaTeX, Mermaid, Shiki, html-to-image, Zustand, Vitest, Playwright.

---

### Task 1: Project Foundation

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `eslint.config.js`
- Create: `.prettierrc.json`
- Create: `index.html`

- [x] Add Vite/React/TypeScript/Tailwind/Vitest configuration.
- [ ] Install runtime and development dependencies with npm.
- [ ] Run `npm test` and confirm the test harness starts.

### Task 2: Core Tests First

**Files:**
- Create: `src/export/waitForAssets.test.ts`
- Create: `src/export/exportImage.test.ts`
- Create: `src/themes/presets.test.ts`
- Create: `src/utils/storage.test.ts`
- Create: `src/tests/fixtures/kitchen-sink.md`

- [ ] Write failing tests for asset waiting, long-document detection, export option construction, theme coverage, and storage fallback.
- [ ] Run `npm test` and confirm failures are caused by missing implementation modules.

### Task 3: Rendering And Themes

**Files:**
- Create: `src/markdown/MarkdownRenderer.tsx`
- Create: `src/markdown/CodeBlock.tsx`
- Create: `src/markdown/MermaidBlock.tsx`
- Create: `src/markdown/sanitizeSchema.ts`
- Create: `src/themes/presets.ts`
- Create: `src/themes/theme.css`

- [ ] Implement React Markdown rendering with GFM, math, KaTeX, sanitized optional raw HTML, Shiki code blocks, and controlled Mermaid blocks.
- [ ] Implement six theme presets: GitHub, dark, paper, minimal, tech, and academic.
- [ ] Run theme and renderer tests.

### Task 4: Export Pipeline

**Files:**
- Create: `src/export/waitForAssets.ts`
- Create: `src/export/exportImage.ts`
- Create: `src/export/clipboard.ts`
- Create: `src/export/sliceLongImage.ts`
- Create: `src/utils/download.ts`

- [ ] Implement `waitForPreviewReady()` to wait for fonts, images, animation frames, and Mermaid blocks.
- [ ] Implement PNG/JPEG/SVG blob export with `html-to-image`.
- [ ] Implement clipboard copy with clear unsupported-browser errors.
- [ ] Implement fixed-height PNG slicing for long documents.
- [ ] Run export tests.

### Task 5: Product UI

**Files:**
- Create: `src/app/App.tsx`
- Create: `src/components/editor/MarkdownEditor.tsx`
- Create: `src/components/preview/PreviewFrame.tsx`
- Create: `src/components/controls/ThemePanel.tsx`
- Create: `src/components/controls/SizePanel.tsx`
- Create: `src/components/controls/ExportPanel.tsx`
- Create: `src/components/common/Toolbar.tsx`
- Create: `src/store/useEditorStore.ts`
- Create: `src/utils/imageInline.ts`
- Create: `src/utils/storage.ts`
- Create: `src/main.tsx`
- Create: `src/index.css`

- [ ] Build a responsive editor/preview/control surface with localStorage persistence.
- [ ] Add clear, copy Markdown, upload local image, copy image, download PNG/JPEG/SVG, and sliced PNG actions.
- [ ] Add visible status and error feedback for CORS, long image, clipboard, and unsupported browser cases.

### Task 6: Documentation And Verification

**Files:**
- Create: `README.md`
- Create: `tests/export.spec.ts`
- Create: `playwright.config.ts`

- [ ] Document scripts, architecture, dependencies, privacy model, and known browser limitations.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Start the dev server and inspect the app in the browser.
