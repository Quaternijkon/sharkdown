# People Daily Layout Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a static offline People's Daily newspaper layout mode while fixing editor toolbar duplication, dark code readability, header branding, and release documentation.

**Architecture:** Add `layoutMode` to document state, route preview rendering through a new newspaper layout renderer, and keep the existing export ref. The newspaper engine is a deterministic Markdown-to-layout classifier and renderer, not a backend or full TeX engine.

**Tech Stack:** React 19, TypeScript, Zustand, Vitest, Testing Library, `@uiw/react-md-editor`, Shiki, existing Sharkdown export pipeline.

---

## File Structure

- Create `src/layouts/peopleDailyLayout.ts`: parse Markdown into semantic newspaper data, choose `front-page`, `long-article`, or `brief`, and paginate paragraph content.
- Create `src/layouts/peopleDailyLayout.test.ts`: unit tests for layout selection and pagination.
- Create `src/components/preview/PeopleDailyRenderer.tsx`: React renderer for newspaper pages.
- Create `src/components/preview/PeopleDailyRenderer.test.tsx`: DOM tests for masthead, long article mode, front-page mode, and page count.
- Modify `src/types.ts`: add `LayoutMode`.
- Modify `src/store/useEditorStore.ts`: persist `layoutMode`.
- Modify `src/components/preview/PreviewFrame.tsx`: route normal and newspaper layouts.
- Modify `src/components/controls/ThemePanel.tsx`: add compact layout-mode selector.
- Modify `src/components/editor/MarkdownEditor.tsx`: remove custom formatting toolbar and use `@uiw/react-md-editor` command toolbar.
- Modify `src/markdown/CodeBlock.tsx`: choose Shiki theme based on current Sharkdown theme.
- Modify `src/markdown/CodeBlock.test.tsx`: cover highlight theme selection through exported helper.
- Modify `src/app/App.tsx`: slogan and GitHub link.
- Modify `src/app/App.test.tsx`: cover slogan and GitHub link.
- Modify `src/themes/theme.css`: add editor sticky toolbar CSS and newspaper CSS fallback variables as needed.
- Modify `README.md`, `CHANGELOG.md`, `package.json`, and `src/version.ts`: release notes and version bump.

## Task 1: Layout State And Parser

**Files:**
- Modify: `src/types.ts`
- Modify: `src/store/useEditorStore.ts`
- Create: `src/layouts/peopleDailyLayout.ts`
- Create: `src/layouts/peopleDailyLayout.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { buildPeopleDailyDocument } from './peopleDailyLayout';

describe('buildPeopleDailyDocument', () => {
  it('selects long-article for one dominant long article', () => {
    const markdown = `# 以更完善的制度体系推动内容自动排版在不同媒介场景中稳定生成高质量分享版面

这是一段很长的正文，用来模拟单篇文章。

这是一段很长的正文，用来模拟单篇文章。

这是一段很长的正文，用来模拟单篇文章。`;

    const doc = buildPeopleDailyDocument(markdown);
    expect(doc.variant).toBe('long-article');
    expect(doc.title).toContain('制度体系');
    expect(doc.pages.length).toBeGreaterThanOrEqual(1);
  });

  it('selects front-page for multi-section source content', () => {
    const markdown = `# 今日要闻

## 第一条新闻
第一条新闻正文。

## 第二条新闻
第二条新闻正文。

## 第三条新闻
第三条新闻正文。`;

    const doc = buildPeopleDailyDocument(markdown);
    expect(doc.variant).toBe('front-page');
    expect(doc.stories).toHaveLength(3);
  });

  it('creates continuation pages for long paragraph streams', () => {
    const paragraphs = Array.from({ length: 42 }, (_, index) => `第${index + 1}段内容用于测试分页。`).join('\n\n');
    const doc = buildPeopleDailyDocument(`# 长文章\n\n${paragraphs}`);
    expect(doc.pages.length).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/layouts/peopleDailyLayout.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement parser and state**

Add `export type LayoutMode = 'markdown' | 'people-daily';`, add `layoutMode` to `DocumentState`, default it to `markdown`, and persist it.

Implement `buildPeopleDailyDocument(markdown)` with deterministic line-based parsing:

- extract first h1 as title;
- group h2/h3 sections into stories;
- collect prose paragraphs;
- collect image Markdown references;
- choose `brief` when prose is tiny, `front-page` for 3+ stories, otherwise `long-article`;
- chunk paragraphs into pages of about 18 paragraphs for the first version.

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- src/layouts/peopleDailyLayout.test.ts`

Expected: PASS.

## Task 2: Newspaper Renderer And Preview Switch

**Files:**
- Create: `src/components/preview/PeopleDailyRenderer.tsx`
- Create: `src/components/preview/PeopleDailyRenderer.test.tsx`
- Modify: `src/components/preview/PreviewFrame.tsx`
- Modify: `src/themes/theme.css`

- [ ] **Step 1: Write failing renderer tests**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PeopleDailyRenderer } from './PeopleDailyRenderer';

describe('PeopleDailyRenderer', () => {
  it('renders a masthead and long-article page for long content', () => {
    render(<PeopleDailyRenderer markdown={'# 长标题\\n\\n正文段落。\\n\\n正文段落。'} />);
    expect(screen.getByText('人民日报')).toBeInTheDocument();
    expect(screen.getByTestId('people-daily-layout')).toHaveAttribute('data-variant', 'long-article');
  });

  it('renders front-page stories for multi-section content', () => {
    render(<PeopleDailyRenderer markdown={'# 今日要闻\\n\\n## 新闻一\\n正文。\\n\\n## 新闻二\\n正文。\\n\\n## 新闻三\\n正文。'} />);
    expect(screen.getByTestId('people-daily-layout')).toHaveAttribute('data-variant', 'front-page');
    expect(screen.getByText('新闻一')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/components/preview/PeopleDailyRenderer.test.tsx`

Expected: FAIL because renderer does not exist.

- [ ] **Step 3: Implement renderer**

Render `.people-daily-layout` containing one or more `.people-daily-page` nodes. Use a masthead, metadata row, headline, optional image placeholders, dense columns, continuation pages, and deterministic story allocation. Keep visual styling in CSS classes rather than inline-heavy component code.

- [ ] **Step 4: Switch PreviewFrame by layout mode**

If `layoutMode === 'people-daily'`, render `PeopleDailyRenderer` inside the existing `markdown-export-frame` article. Otherwise render `MarkdownRenderer` exactly as before.

- [ ] **Step 5: Run tests**

Run: `npm test -- src/components/preview/PeopleDailyRenderer.test.tsx`

Expected: PASS.

## Task 3: Controls, Editor Toolbar, Header, And Code Highlighting

**Files:**
- Modify: `src/components/controls/ThemePanel.tsx`
- Modify: `src/components/editor/MarkdownEditor.tsx`
- Modify: `src/markdown/CodeBlock.tsx`
- Create or modify: `src/markdown/CodeBlock.test.tsx`
- Modify: `src/app/App.tsx`
- Create or modify: `src/app/App.test.tsx`
- Modify: `src/themes/theme.css`

- [ ] **Step 1: Write failing tests**

Add tests asserting:

- layout selector can set `people-daily`;
- the app header shows `share markdown！`;
- the GitHub link points to `https://github.com/Quaternijkon/sharkdown`;
- dark themes use a dark Shiki theme.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/components/controls/ThemePanel.test.tsx src/app/App.test.tsx src/markdown/CodeBlock.test.tsx`

Expected: FAIL for missing controls/tests/helpers.

- [ ] **Step 3: Implement UI and code highlighting changes**

Use the existing `@uiw/react-md-editor` toolbar commands instead of Sharkdown's custom format toolbar. Keep only the top document action bar for restore, image insert, copy, and clear. Make the editor toolbar sticky/floating with CSS so it remains accessible while editing long content.

Export `getCodeHighlightTheme(themeId)` from `CodeBlock.tsx`; return `github-dark` for `douyin` and `black-gold`, otherwise `github-light`. Read `themeId` from `useEditorStore`.

Update header slogan to `share markdown！` and add a top-right GitHub icon link.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- src/components/controls/ThemePanel.test.tsx src/app/App.test.tsx src/markdown/CodeBlock.test.tsx`

Expected: PASS.

## Task 4: Release Docs And Full Verification

**Files:**
- Modify: `package.json`
- Modify: `src/version.ts`
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Bump version**

Set package and app version to `1.3.0`.

- [ ] **Step 2: Update docs**

Document:

- People's Daily layout mode;
- automatic long article vs front-page layout selection;
- editor toolbar cleanup;
- dark code readability fix;
- header GitHub link.

- [ ] **Step 3: Full verification**

Run:

```powershell
npm test
npm run lint
npm run build
npx playwright test
```

Expected: all commands pass.

- [ ] **Step 4: Commit**

Stage only intentional files, excluding `.superpowers/` and unrelated untracked old plan files.
