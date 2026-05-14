# Convert Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Sharkdown from a Share Markdown workbench into a stronger offline Markdown conversion tool for social-media-ready images, carousel cards, rich text, HTML fragments, PDF handouts, and bundled export packages.

**Architecture:** Keep the app as a pure static Vite/React site with no account system, no proprietary backend, and no automatic network upload. Add a conversion layer that turns the current Markdown/rendered preview into typed artifacts, then expose platform presets, batch export, carousel splitting, target-specific preflight checks, and versioned release documentation. Existing image/PDF/HTML/share modules remain the foundation; new code should wrap and compose them instead of replacing them.

**Tech Stack:** React 19, TypeScript, Zustand, Vitest/jsdom, Playwright, existing `html-to-image` image export path, existing text PDF print path, browser Clipboard/File APIs, optional `fflate` for client-side ZIP generation if batch packages are implemented.

---

## Product Boundaries

This phase is about **convert** capabilities only.

Keep:
- Static GitHub Pages deployment.
- Offline-first behavior after the app shell is cached.
- Local-only document, image, template, and export handling.
- User-triggered downloads, copies, and system shares.

Do not add:
- Login, subscription enforcement, billing, user accounts, license servers, analytics, or telemetry.
- Cloud sync, permanent hosted links, database storage, comments, collaboration, or OAuth publishing.
- Server-side rendering through Puppeteer/Playwright.
- Automatic upload to any social platform.

Subscription can be considered later as a distribution/business layer, but this implementation plan must not introduce network-dependent product behavior.

---

## File Structure

Create focused modules under a new `src/convert/` folder and keep export adapters under `src/export/`.

- Create: `src/version.ts`  
  Single source of truth for display/runtime app version, imported from UI and artifact metadata.

- Create: `src/convert/artifact.ts`  
  Shared `ConvertArtifact`, `ConvertTarget`, and metadata types.

- Create: `src/convert/platformPresets.ts`  
  Social/platform presets: aspect ratio, target width, allowed artifact kinds, typography hints, and warnings.

- Create: `src/convert/segmentMarkdown.ts`  
  Pure Markdown splitting for carousel/slides/threads.

- Create: `src/convert/htmlFragment.ts`  
  Target-specific HTML fragment normalization for rich-text copy.

- Create: `src/convert/convertPreflight.ts`  
  Per-target diagnostics for overflow, unsupported content, remote assets, large local images, tables, formulas, and privacy-sensitive content.

- Create: `src/export/batchPackage.ts`  
  Build a ZIP-like offline package containing generated artifacts and a manifest. Prefer `fflate` for ZIP; if dependency is not accepted, implement a manifest plus multiple-download fallback.

- Create: `src/export/pdfProfiles.ts`  
  PDF preset definitions for text PDF handouts.

- Create: `src/components/convert/ConvertPanel.tsx`  
  Main convert workflow panel.

- Create: `src/components/convert/PlatformPresetPicker.tsx`  
  Compact target preset picker.

- Create: `src/components/convert/CarouselPanel.tsx`  
  Markdown splitting and carousel/card export controls.

- Create: `src/components/convert/PreflightPanel.tsx`  
  Target-specific diagnostics and suggested fixes.

- Modify: `src/app/App.tsx`  
  Add Convert panel entry without crowding the existing share/theme/export panels.

- Modify: `src/components/controls/ExportPanel.tsx`  
  Keep basic single-artifact export, but link advanced conversions to the Convert panel.

- Modify: `src/export/pdfExport.ts`  
  Accept named PDF profiles without regressing current text PDF behavior.

- Modify: `src/share/htmlExport.ts`  
  Reuse HTML serialization for standalone HTML and fragment exports where possible.

- Modify: `src/share/projectPackage.ts`  
  Include `appVersion` from `src/version.ts` instead of hard-coded fallback strings.

- Modify: `README.md`  
  Keep feature list current and link to `CHANGELOG.md`.

- Create or update: `CHANGELOG.md`  
  Record every version with date, major additions, fixes, and compatibility notes.

- Test files:
  - Create: `src/convert/artifact.test.ts`
  - Create: `src/convert/platformPresets.test.ts`
  - Create: `src/convert/segmentMarkdown.test.ts`
  - Create: `src/convert/htmlFragment.test.ts`
  - Create: `src/convert/convertPreflight.test.ts`
  - Create: `src/export/batchPackage.test.ts`
  - Create: `src/export/pdfProfiles.test.ts`
  - Create: `src/components/convert/ConvertPanel.test.tsx`
  - Modify: `src/share/projectPackage.test.ts`
  - Modify: `tests/export.spec.ts`

---

### Task 1: Version And Release Discipline

**Files:**
- Create: `src/version.ts`
- Modify: `src/share/projectPackage.ts`
- Modify: `src/share/projectPackage.test.ts`
- Modify: `README.md`
- Create: `CHANGELOG.md`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Write failing tests for centralized version metadata**

Add a test to `src/share/projectPackage.test.ts` that expects exported `.sharkdown` manifests to use the app version from a central module.

```ts
import { APP_VERSION } from '../version';

it('uses the centralized app version in package manifests', async () => {
  const blob = await createProjectPackageBlob({
    markdown: '# Versioned export',
    settings: {},
    assets: [],
  });

  const parsed = await parseProjectPackageFile(new File([blob], 'doc.sharkdown'));

  expect(parsed.manifest.appVersion).toBe(APP_VERSION);
});
```

Run: `npm test -- src/share/projectPackage.test.ts`  
Expected: FAIL if project package export still falls back to a literal version.

- [ ] **Step 2: Add the central version module**

Create `src/version.ts`:

```ts
export const APP_VERSION = '0.2.0';

export const APP_RELEASE_DATE = '2026-05-15';
```

Use `0.2.0` for this Convert Phase 3 release. If the implementation lands in smaller slices, use `0.2.0-alpha.N` locally during development and finish with `0.2.0` before the release commit.

- [ ] **Step 3: Replace hard-coded app version fallback**

In `src/share/projectPackage.ts`, import `APP_VERSION` and use it when no explicit `appVersion` is supplied:

```ts
import { APP_VERSION } from '../version';

// inside createProjectPackageBlob manifest creation
appVersion: input.appVersion ?? APP_VERSION,
```

- [ ] **Step 4: Bump package version**

Run:

```bash
npm version 0.2.0 --no-git-tag-version
```

Expected:
- `package.json` version becomes `0.2.0`.
- `package-lock.json` root package version becomes `0.2.0`.
- No git tag is created.

- [ ] **Step 5: Create changelog**

Create `CHANGELOG.md` with this structure:

```markdown
# Changelog

All notable changes to Sharkdown are recorded here. The app follows practical semantic versioning while it remains a private local tool.

## [0.2.0] - 2026-05-15

### Added
- Convert workspace for platform presets, carousel splitting, target preflight, batch export, and richer format handoff.

### Changed
- App version is centralized in `src/version.ts` and written into generated artifacts.

### Compatibility
- Still a static offline-first browser app. No backend, account system, telemetry, or upload flow is introduced.

## [0.1.0] - 2026-05-15

### Added
- Offline Share Markdown workbench with Markdown preview, local document library, themes, image export, text PDF export, `.sharkdown` packages, standalone HTML export, URL fragment sharing, privacy scan, templates, and PWA shell.
```

- [ ] **Step 6: Add README version section**

Append this section to `README.md`:

```markdown
## 版本与更新记录

当前版本以 `package.json` 和 `src/version.ts` 为准。每次功能更新必须同步维护：

- `package.json` 和 `package-lock.json` 的版本号。
- `src/version.ts` 的 `APP_VERSION` 与 `APP_RELEASE_DATE`。
- `CHANGELOG.md` 的版本更新记录。
- README 的功能范围、架构说明和浏览器限制。

版本策略：

- 修复导出错误、样式错位、兼容性问题：递增 patch，例如 `0.2.1`。
- 增加新的转换格式、平台预设、批量导出、重要 UI 工作流：递增 minor，例如 `0.3.0`。
- 破坏 `.sharkdown`、文档库、模板或导出 manifest 的兼容性：递增 major，并在 changelog 写清楚迁移方式。

完整记录见 [CHANGELOG.md](CHANGELOG.md)。
```

- [ ] **Step 7: Verify version task**

Run:

```bash
npm test -- src/share/projectPackage.test.ts
npm run build
```

Expected:
- Version test passes.
- Build passes.
- Build output still contains only static assets.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/version.ts src/share/projectPackage.ts src/share/projectPackage.test.ts README.md CHANGELOG.md
git commit -m "chore: add versioned release tracking"
```

---

### Task 2: Conversion Artifact Types

**Files:**
- Create: `src/convert/artifact.ts`
- Create: `src/convert/artifact.test.ts`

- [ ] **Step 1: Write failing tests for artifact metadata**

Create `src/convert/artifact.test.ts`:

```ts
import { createTextArtifact, estimateArtifactSize, isBinaryArtifact } from './artifact';

describe('convert artifacts', () => {
  it('creates text artifacts with stable metadata', () => {
    const artifact = createTextArtifact({
      kind: 'markdown',
      fileName: 'note.md',
      mimeType: 'text/markdown;charset=utf-8',
      text: '# Note',
      title: 'Note',
      targetId: 'github',
      includesSourceMarkdown: true,
    });

    expect(artifact.kind).toBe('markdown');
    expect(artifact.fileName).toBe('note.md');
    expect(artifact.size).toBeGreaterThan(0);
    expect(artifact.metadata.title).toBe('Note');
    expect(artifact.metadata.targetId).toBe('github');
    expect(artifact.metadata.includesSourceMarkdown).toBe(true);
  });

  it('distinguishes binary and text artifacts', () => {
    expect(isBinaryArtifact({ kind: 'png', blob: new Blob(['x']) })).toBe(true);
    expect(isBinaryArtifact({ kind: 'html-fragment', text: '<p>x</p>' })).toBe(false);
  });

  it('estimates unicode text size as utf-8 bytes', () => {
    expect(estimateArtifactSize('中文')).toBe(6);
  });
});
```

Run: `npm test -- src/convert/artifact.test.ts`  
Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement artifact types and helpers**

Create `src/convert/artifact.ts`:

```ts
import { APP_VERSION } from '../version';

export type ConvertArtifactKind =
  | 'png'
  | 'jpeg'
  | 'webp'
  | 'svg'
  | 'pdf'
  | 'html'
  | 'html-fragment'
  | 'markdown'
  | 'plain-text'
  | 'rich-text'
  | 'zip'
  | 'sharkdown';

export type ConvertTargetId =
  | 'generic'
  | 'wechat'
  | 'xiaohongshu'
  | 'douyin'
  | 'zhihu'
  | 'github'
  | 'notion'
  | 'email'
  | 'slides'
  | 'print';

export interface ConvertArtifactMetadata {
  title: string;
  targetId: ConvertTargetId;
  includesSourceMarkdown: boolean;
  includesLocalAssets: boolean;
  createdAt: string;
  appVersion: string;
}

export interface ConvertArtifact {
  id: string;
  kind: ConvertArtifactKind;
  fileName: string;
  mimeType: string;
  size: number;
  blob?: Blob;
  text?: string;
  metadata: ConvertArtifactMetadata;
}

export interface CreateTextArtifactInput {
  kind: Extract<ConvertArtifactKind, 'html' | 'html-fragment' | 'markdown' | 'plain-text' | 'rich-text'>;
  fileName: string;
  mimeType: string;
  text: string;
  title: string;
  targetId: ConvertTargetId;
  includesSourceMarkdown: boolean;
  includesLocalAssets?: boolean;
  now?: Date;
  appVersion?: string;
}

export function estimateArtifactSize(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

export function isBinaryArtifact(value: Pick<ConvertArtifact, 'blob' | 'text'>): boolean {
  return value.blob instanceof Blob && typeof value.text !== 'string';
}

export function createTextArtifact(input: CreateTextArtifactInput): ConvertArtifact {
  const createdAt = (input.now ?? new Date()).toISOString();

  return {
    id: `${input.kind}-${createdAt}`,
    kind: input.kind,
    fileName: input.fileName,
    mimeType: input.mimeType,
    size: estimateArtifactSize(input.text),
    text: input.text,
    metadata: {
      title: input.title,
      targetId: input.targetId,
      includesSourceMarkdown: input.includesSourceMarkdown,
      includesLocalAssets: input.includesLocalAssets ?? false,
      createdAt,
      appVersion: input.appVersion ?? APP_VERSION,
    },
  };
}
```

- [ ] **Step 3: Verify artifact tests**

Run: `npm test -- src/convert/artifact.test.ts`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/convert/artifact.ts src/convert/artifact.test.ts
git commit -m "feat: add conversion artifact model"
```

---

### Task 3: Platform Conversion Presets

**Files:**
- Create: `src/convert/platformPresets.ts`
- Create: `src/convert/platformPresets.test.ts`
- Modify: `src/types.ts` only if existing canvas/export setting types need to be reused.

- [ ] **Step 1: Write failing tests for platform presets**

Create `src/convert/platformPresets.test.ts`:

```ts
import { getPlatformPreset, listPlatformPresets } from './platformPresets';

describe('platform conversion presets', () => {
  it('provides compact offline presets for social media cards', () => {
    const presets = listPlatformPresets();

    expect(presets.map((preset) => preset.id)).toEqual(
      expect.arrayContaining(['wechat', 'xiaohongshu', 'douyin', 'github', 'email', 'print']),
    );
    expect(getPlatformPreset('xiaohongshu')?.canvas.width).toBe(1080);
    expect(getPlatformPreset('douyin')?.canvas.aspectRatio).toBe('9:16');
  });

  it('does not define any network upload action', () => {
    for (const preset of listPlatformPresets()) {
      expect(preset.delivery).not.toContain('upload');
      expect(preset.requiresNetwork).toBe(false);
    }
  });
});
```

Run: `npm test -- src/convert/platformPresets.test.ts`  
Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement preset catalog**

Create `src/convert/platformPresets.ts`:

```ts
import type { ConvertArtifactKind, ConvertTargetId } from './artifact';

export interface PlatformPreset {
  id: ConvertTargetId;
  label: string;
  description: string;
  delivery: Array<'download' | 'copy' | 'system-share'>;
  requiresNetwork: false;
  recommendedArtifacts: ConvertArtifactKind[];
  canvas: {
    width: number;
    aspectRatio: 'auto' | '1:1' | '4:5' | '9:16' | '16:9' | 'A4';
    padding: number;
  };
  typography: {
    tone: 'serif' | 'sans' | 'mono' | 'system';
    maxLineLength: number;
  };
  warnings: string[];
}

const PRESETS: PlatformPreset[] = [
  {
    id: 'wechat',
    label: '微信公众号',
    description: '面向富文本复制和长图备份。',
    delivery: ['copy', 'download'],
    requiresNetwork: false,
    recommendedArtifacts: ['html-fragment', 'rich-text', 'png', 'pdf'],
    canvas: { width: 900, aspectRatio: 'auto', padding: 40 },
    typography: { tone: 'serif', maxLineLength: 38 },
    warnings: ['外部编辑器可能移除部分 CSS，导出前需要预览复制效果。'],
  },
  {
    id: 'xiaohongshu',
    label: '小红书图文',
    description: '适合 1:1 或 4:5 知识卡片与多图轮播。',
    delivery: ['download', 'system-share'],
    requiresNetwork: false,
    recommendedArtifacts: ['png', 'jpeg', 'zip'],
    canvas: { width: 1080, aspectRatio: '4:5', padding: 72 },
    typography: { tone: 'sans', maxLineLength: 24 },
    warnings: ['建议把长文拆成多张卡片，单张不要承载过多文字。'],
  },
  {
    id: 'douyin',
    label: '抖音竖屏',
    description: '适合 9:16 竖屏知识图、封面和图文视频素材。',
    delivery: ['download', 'system-share'],
    requiresNetwork: false,
    recommendedArtifacts: ['png', 'jpeg', 'zip'],
    canvas: { width: 1080, aspectRatio: '9:16', padding: 88 },
    typography: { tone: 'sans', maxLineLength: 20 },
    warnings: ['竖屏内容需要更大的字号和更短的段落。'],
  },
  {
    id: 'zhihu',
    label: '知乎长文',
    description: '适合 Markdown、HTML 片段和文本 PDF。',
    delivery: ['copy', 'download'],
    requiresNetwork: false,
    recommendedArtifacts: ['markdown', 'html-fragment', 'pdf'],
    canvas: { width: 820, aspectRatio: 'auto', padding: 36 },
    typography: { tone: 'serif', maxLineLength: 42 },
    warnings: ['复杂表格和 Mermaid 建议同时导出图片备份。'],
  },
  {
    id: 'github',
    label: 'GitHub README',
    description: '适合纯 Markdown 和代码友好的 HTML 备份。',
    delivery: ['copy', 'download'],
    requiresNetwork: false,
    recommendedArtifacts: ['markdown', 'html', 'pdf'],
    canvas: { width: 980, aspectRatio: 'auto', padding: 32 },
    typography: { tone: 'system', maxLineLength: 80 },
    warnings: ['GitHub 不支持所有 raw HTML 和 Mermaid 语法变体。'],
  },
  {
    id: 'notion',
    label: 'Notion/知识库',
    description: '适合富文本复制、Markdown 和 HTML 片段。',
    delivery: ['copy', 'download'],
    requiresNetwork: false,
    recommendedArtifacts: ['rich-text', 'markdown', 'html-fragment'],
    canvas: { width: 860, aspectRatio: 'auto', padding: 36 },
    typography: { tone: 'system', maxLineLength: 46 },
    warnings: ['粘贴后的块级结构由目标编辑器决定。'],
  },
  {
    id: 'email',
    label: '邮件正文',
    description: '适合稳定、内联样式较少的 HTML 片段和纯文本。',
    delivery: ['copy', 'download'],
    requiresNetwork: false,
    recommendedArtifacts: ['html-fragment', 'plain-text', 'pdf'],
    canvas: { width: 760, aspectRatio: 'auto', padding: 32 },
    typography: { tone: 'system', maxLineLength: 54 },
    warnings: ['邮件客户端会裁剪脚本和部分 CSS，避免复杂布局。'],
  },
  {
    id: 'print',
    label: '打印/PDF',
    description: '适合 A4 文档、讲义、可选择文本 PDF。',
    delivery: ['download'],
    requiresNetwork: false,
    recommendedArtifacts: ['pdf', 'html'],
    canvas: { width: 794, aspectRatio: 'A4', padding: 48 },
    typography: { tone: 'serif', maxLineLength: 52 },
    warnings: ['宽表格需要在导出前检查横向溢出。'],
  },
];

export function listPlatformPresets(): PlatformPreset[] {
  return PRESETS;
}

export function getPlatformPreset(id: ConvertTargetId): PlatformPreset | undefined {
  return PRESETS.find((preset) => preset.id === id);
}
```

- [ ] **Step 3: Verify preset tests**

Run: `npm test -- src/convert/platformPresets.test.ts`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/convert/platformPresets.ts src/convert/platformPresets.test.ts
git commit -m "feat: add platform conversion presets"
```

---

### Task 4: Markdown Segmentation For Carousel Cards

**Files:**
- Create: `src/convert/segmentMarkdown.ts`
- Create: `src/convert/segmentMarkdown.test.ts`

- [ ] **Step 1: Write failing tests for segmentation**

Create `src/convert/segmentMarkdown.test.ts`:

```ts
import { segmentMarkdownForCards } from './segmentMarkdown';

describe('segmentMarkdownForCards', () => {
  it('splits by explicit slide separators first', () => {
    const result = segmentMarkdownForCards('# A\nText\n---\n# B\nMore', { maxChars: 120 });

    expect(result.cards).toHaveLength(2);
    expect(result.cards[0].markdown).toContain('# A');
    expect(result.cards[1].markdown).toContain('# B');
  });

  it('splits long documents by second-level headings', () => {
    const result = segmentMarkdownForCards('# Title\n## One\nA\n## Two\nB', { maxChars: 80 });

    expect(result.cards.map((card) => card.title)).toEqual(['Title', 'One', 'Two']);
  });

  it('marks cards that still exceed the target length', () => {
    const longText = `# Long\n${'x'.repeat(180)}`;
    const result = segmentMarkdownForCards(longText, { maxChars: 60 });

    expect(result.cards.some((card) => card.warnings.includes('too-long'))).toBe(true);
  });
});
```

Run: `npm test -- src/convert/segmentMarkdown.test.ts`  
Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement segmentation helper**

Create `src/convert/segmentMarkdown.ts`:

```ts
export interface SegmentOptions {
  maxChars: number;
}

export interface MarkdownCardSegment {
  index: number;
  title: string;
  markdown: string;
  charCount: number;
  warnings: Array<'too-long' | 'empty-title'>;
}

export interface MarkdownSegmentationResult {
  cards: MarkdownCardSegment[];
  sourceCharCount: number;
}

function extractTitle(markdown: string, fallback: string): string {
  const heading = markdown.match(/^#{1,3}\s+(.+)$/m)?.[1]?.trim();
  return heading || fallback;
}

function toCard(markdown: string, index: number, options: SegmentOptions): MarkdownCardSegment {
  const normalized = markdown.trim();
  const title = extractTitle(normalized, `卡片 ${index + 1}`);
  const warnings: MarkdownCardSegment['warnings'] = [];

  if (normalized.length > options.maxChars) warnings.push('too-long');
  if (!/^#{1,3}\s+.+$/m.test(normalized)) warnings.push('empty-title');

  return {
    index,
    title,
    markdown: normalized,
    charCount: normalized.length,
    warnings,
  };
}

export function segmentMarkdownForCards(markdown: string, options: SegmentOptions): MarkdownSegmentationResult {
  const explicit = markdown
    .split(/\n-{3,}\n/g)
    .map((part) => part.trim())
    .filter(Boolean);

  const parts =
    explicit.length > 1
      ? explicit
      : markdown
          .split(/(?=^##\s+)/m)
          .map((part) => part.trim())
          .filter(Boolean);

  return {
    cards: parts.map((part, index) => toCard(part, index, options)),
    sourceCharCount: markdown.length,
  };
}
```

- [ ] **Step 3: Verify segmentation tests**

Run: `npm test -- src/convert/segmentMarkdown.test.ts`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/convert/segmentMarkdown.ts src/convert/segmentMarkdown.test.ts
git commit -m "feat: split markdown into carousel cards"
```

---

### Task 5: Target-Specific HTML Fragment Conversion

**Files:**
- Create: `src/convert/htmlFragment.ts`
- Create: `src/convert/htmlFragment.test.ts`
- Modify: `src/share/clipboardFormats.ts`

- [ ] **Step 1: Write failing tests for HTML fragment normalization**

Create `src/convert/htmlFragment.test.ts`:

```ts
import { createHtmlFragmentArtifact, normalizeHtmlForTarget } from './htmlFragment';

describe('html fragment conversion', () => {
  it('removes scripts and event handlers from copied fragments', () => {
    const html = '<article><h1 onclick="x()">Hi</h1><script>alert(1)</script></article>';
    const normalized = normalizeHtmlForTarget(html, 'wechat');

    expect(normalized).toContain('<h1>Hi</h1>');
    expect(normalized).not.toContain('script');
    expect(normalized).not.toContain('onclick');
  });

  it('creates html-fragment artifacts with source metadata', () => {
    const artifact = createHtmlFragmentArtifact({
      html: '<p>Hello</p>',
      title: 'Hello',
      targetId: 'email',
      includesLocalAssets: false,
    });

    expect(artifact.kind).toBe('html-fragment');
    expect(artifact.mimeType).toBe('text/html;charset=utf-8');
    expect(artifact.text).toContain('<p>Hello</p>');
  });
});
```

Run: `npm test -- src/convert/htmlFragment.test.ts`  
Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement HTML fragment conversion**

Create `src/convert/htmlFragment.ts`:

```ts
import { APP_VERSION } from '../version';
import type { ConvertTargetId } from './artifact';
import { createTextArtifact } from './artifact';

const EVENT_HANDLER_PATTERN = /\s+on[a-z]+\s*=\s*(['"]).*?\1/gi;
const SCRIPT_PATTERN = /<script\b[^>]*>[\s\S]*?<\/script>/gi;

export function normalizeHtmlForTarget(html: string, targetId: ConvertTargetId): string {
  const cleaned = html.replace(SCRIPT_PATTERN, '').replace(EVENT_HANDLER_PATTERN, '');

  if (targetId === 'email') {
    return cleaned.replace(/\sclass=(['"]).*?\1/gi, '');
  }

  return cleaned;
}

export function createHtmlFragmentArtifact(input: {
  html: string;
  title: string;
  targetId: ConvertTargetId;
  includesLocalAssets: boolean;
}) {
  return createTextArtifact({
    kind: 'html-fragment',
    fileName: `${input.title || 'sharkdown'}.html`,
    mimeType: 'text/html;charset=utf-8',
    text: normalizeHtmlForTarget(input.html, input.targetId),
    title: input.title || 'Untitled',
    targetId: input.targetId,
    includesSourceMarkdown: false,
    includesLocalAssets: input.includesLocalAssets,
    appVersion: APP_VERSION,
  });
}
```

- [ ] **Step 3: Wire fragment conversion into clipboard helpers**

In `src/share/clipboardFormats.ts`, add an exported helper that accepts the normalized HTML fragment. Do not duplicate clipboard writing logic if a function already writes `text/html` and `text/plain`; reuse it.

```ts
export interface RichClipboardPayload {
  html: string;
  plainText: string;
}
```

If this type or an equivalent already exists, keep the existing type and import `normalizeHtmlForTarget` from `src/convert/htmlFragment.ts`.

- [ ] **Step 4: Verify HTML fragment tests and clipboard tests**

Run:

```bash
npm test -- src/convert/htmlFragment.test.ts src/share
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/convert/htmlFragment.ts src/convert/htmlFragment.test.ts src/share/clipboardFormats.ts
git commit -m "feat: add target html fragment conversion"
```

---

### Task 6: Convert Preflight Diagnostics

**Files:**
- Create: `src/convert/convertPreflight.ts`
- Create: `src/convert/convertPreflight.test.ts`
- Reuse: `src/share/privacyScan.ts`

- [ ] **Step 1: Write failing tests for target diagnostics**

Create `src/convert/convertPreflight.test.ts`:

```ts
import { runConvertPreflight } from './convertPreflight';

describe('runConvertPreflight', () => {
  it('warns when a card target receives too much text', () => {
    const result = runConvertPreflight({
      markdown: '# Long\n' + 'x'.repeat(900),
      renderedHtml: '<h1>Long</h1><p>x</p>',
      targetId: 'xiaohongshu',
      estimatedLocalAssetBytes: 0,
    });

    expect(result.items.some((item) => item.code === 'card-text-too-long')).toBe(true);
  });

  it('warns about remote images for offline conversion', () => {
    const result = runConvertPreflight({
      markdown: '![x](https://example.com/a.png)',
      renderedHtml: '<img src="https://example.com/a.png">',
      targetId: 'print',
      estimatedLocalAssetBytes: 0,
    });

    expect(result.items.some((item) => item.code === 'remote-image')).toBe(true);
  });

  it('allows simple markdown for github export', () => {
    const result = runConvertPreflight({
      markdown: '# OK\n\nText',
      renderedHtml: '<h1>OK</h1><p>Text</p>',
      targetId: 'github',
      estimatedLocalAssetBytes: 0,
    });

    expect(result.severity).toBe('ok');
  });
});
```

Run: `npm test -- src/convert/convertPreflight.test.ts`  
Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement preflight diagnostics**

Create `src/convert/convertPreflight.ts`:

```ts
import type { ConvertTargetId } from './artifact';

export type ConvertPreflightSeverity = 'ok' | 'info' | 'warning' | 'error';

export interface ConvertPreflightItem {
  code:
    | 'card-text-too-long'
    | 'remote-image'
    | 'local-assets-large'
    | 'wide-table'
    | 'raw-html'
    | 'formula-check'
    | 'mermaid-check';
  severity: Exclude<ConvertPreflightSeverity, 'ok'>;
  message: string;
}

export interface ConvertPreflightInput {
  markdown: string;
  renderedHtml: string;
  targetId: ConvertTargetId;
  estimatedLocalAssetBytes: number;
}

export interface ConvertPreflightResult {
  severity: ConvertPreflightSeverity;
  items: ConvertPreflightItem[];
}

function highestSeverity(items: ConvertPreflightItem[]): ConvertPreflightSeverity {
  if (items.some((item) => item.severity === 'error')) return 'error';
  if (items.some((item) => item.severity === 'warning')) return 'warning';
  if (items.some((item) => item.severity === 'info')) return 'info';
  return 'ok';
}

export function runConvertPreflight(input: ConvertPreflightInput): ConvertPreflightResult {
  const items: ConvertPreflightItem[] = [];
  const compactCardTarget = input.targetId === 'xiaohongshu' || input.targetId === 'douyin';

  if (compactCardTarget && input.markdown.length > 700) {
    items.push({
      code: 'card-text-too-long',
      severity: 'warning',
      message: '当前内容对于单张社交卡片过长，建议拆成轮播卡片。',
    });
  }

  if (/!\[[^\]]*]\(https?:\/\//.test(input.markdown) || /<img[^>]+src=["']https?:\/\//i.test(input.renderedHtml)) {
    items.push({
      code: 'remote-image',
      severity: 'warning',
      message: '包含远程图片，离线导出和 canvas 导出可能失败。',
    });
  }

  if (input.estimatedLocalAssetBytes > 20 * 1024 * 1024) {
    items.push({
      code: 'local-assets-large',
      severity: 'info',
      message: '本地图片体积较大，批量导出可能需要更长时间。',
    });
  }

  if (/<table[\s>]/i.test(input.renderedHtml)) {
    items.push({
      code: 'wide-table',
      severity: 'info',
      message: '表格在窄屏卡片或 PDF 中可能横向溢出。',
    });
  }

  if (/<[a-z][\s\S]*>/i.test(input.markdown)) {
    items.push({
      code: 'raw-html',
      severity: 'info',
      message: 'Markdown 包含原始 HTML，目标平台可能会过滤。',
    });
  }

  if (/\$\$?/.test(input.markdown)) {
    items.push({
      code: 'formula-check',
      severity: 'info',
      message: '包含公式，导出前应确认 KaTeX 渲染完成。',
    });
  }

  if (/```mermaid|^graph\s|^sequenceDiagram/m.test(input.markdown)) {
    items.push({
      code: 'mermaid-check',
      severity: 'info',
      message: '包含 Mermaid 图表，导出前应确认图表已经静态渲染。',
    });
  }

  return {
    severity: highestSeverity(items),
    items,
  };
}
```

- [ ] **Step 3: Verify preflight tests**

Run: `npm test -- src/convert/convertPreflight.test.ts`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/convert/convertPreflight.ts src/convert/convertPreflight.test.ts
git commit -m "feat: add conversion preflight diagnostics"
```

---

### Task 7: PDF Profiles For Text PDF Export

**Files:**
- Create: `src/export/pdfProfiles.ts`
- Create: `src/export/pdfProfiles.test.ts`
- Modify: `src/export/pdfExport.ts`
- Modify: `src/components/controls/ExportPanel.tsx`

- [ ] **Step 1: Write failing tests for PDF profiles**

Create `src/export/pdfProfiles.test.ts`:

```ts
import { getPdfProfile, listPdfProfiles } from './pdfProfiles';

describe('pdf profiles', () => {
  it('provides practical text-pdf layouts', () => {
    expect(listPdfProfiles().map((profile) => profile.id)).toEqual(
      expect.arrayContaining(['a4-report', 'mobile-reading', 'handout']),
    );
    expect(getPdfProfile('a4-report')?.page.marginTopMm).toBeGreaterThan(0);
  });

  it('keeps profiles serializable', () => {
    expect(() => JSON.stringify(listPdfProfiles())).not.toThrow();
  });
});
```

Run: `npm test -- src/export/pdfProfiles.test.ts`  
Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement PDF profiles**

Create `src/export/pdfProfiles.ts`:

```ts
export type PdfProfileId = 'a4-report' | 'mobile-reading' | 'handout';

export interface PdfProfile {
  id: PdfProfileId;
  label: string;
  description: string;
  page: {
    size: 'A4' | 'Letter';
    marginTopMm: number;
    marginRightMm: number;
    marginBottomMm: number;
    marginLeftMm: number;
  };
  features: {
    cover: boolean;
    toc: boolean;
    header: boolean;
    footer: boolean;
    printBackground: boolean;
  };
}

const PDF_PROFILES: PdfProfile[] = [
  {
    id: 'a4-report',
    label: 'A4 正式文档',
    description: '适合方案、报告、教程和需要目录的可选择文本 PDF。',
    page: { size: 'A4', marginTopMm: 18, marginRightMm: 16, marginBottomMm: 18, marginLeftMm: 16 },
    features: { cover: true, toc: true, header: true, footer: true, printBackground: true },
  },
  {
    id: 'mobile-reading',
    label: '移动阅读',
    description: '较窄版心和更大字号，适合手机阅读型 PDF。',
    page: { size: 'A4', marginTopMm: 14, marginRightMm: 22, marginBottomMm: 18, marginLeftMm: 22 },
    features: { cover: false, toc: true, header: false, footer: true, printBackground: true },
  },
  {
    id: 'handout',
    label: '讲义',
    description: '适合课程资料、会议材料和打印分发。',
    page: { size: 'A4', marginTopMm: 20, marginRightMm: 20, marginBottomMm: 20, marginLeftMm: 20 },
    features: { cover: true, toc: false, header: true, footer: true, printBackground: false },
  },
];

export function listPdfProfiles(): PdfProfile[] {
  return PDF_PROFILES;
}

export function getPdfProfile(id: PdfProfileId): PdfProfile | undefined {
  return PDF_PROFILES.find((profile) => profile.id === id);
}
```

- [ ] **Step 3: Wire profiles into PDF export settings**

In `src/export/pdfExport.ts`, accept profile-derived settings without removing existing explicit settings. If the existing API accepts margins/header/footer directly, add a helper:

```ts
import type { PdfProfile } from './pdfProfiles';

export function settingsFromPdfProfile(profile: PdfProfile) {
  return {
    pageSize: profile.page.size === 'A4' ? 'a4' : 'letter',
    orientation: 'portrait',
    margin: Math.round(((profile.page.marginTopMm + profile.page.marginRightMm + profile.page.marginBottomMm + profile.page.marginLeftMm) / 4) * 2.83465),
    includeToc: profile.features.toc,
    includeHeaderFooter: profile.features.header || profile.features.footer,
    includePageNumbers: profile.features.footer,
  };
}
```

This maps onto the existing `PdfExportSettings` fields: `pageSize`, `orientation`, `margin`, `includeToc`, `includeHeaderFooter`, and `includePageNumbers`. Keep `title` and `backgroundColor` supplied by the current ExportPanel state so profile selection does not overwrite the user's document title or theme background.

- [ ] **Step 4: Add PDF profile selector in ExportPanel**

In `src/components/controls/ExportPanel.tsx`, add a compact select/segmented control under PDF-specific settings only. Do not put PDF-only options in global export settings.

Expected UI behavior:
- Selecting a PDF profile updates PDF settings.
- Existing manual margin/header/footer controls remain available.
- Image export controls are unchanged.

- [ ] **Step 5: Verify PDF profile tests**

Run:

```bash
npm test -- src/export/pdfProfiles.test.ts src/export/pdfExport.test.ts
npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/export/pdfProfiles.ts src/export/pdfProfiles.test.ts src/export/pdfExport.ts src/components/controls/ExportPanel.tsx
git commit -m "feat: add pdf conversion profiles"
```

---

### Task 8: Batch Export Package

**Files:**
- Create: `src/export/batchPackage.ts`
- Create: `src/export/batchPackage.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Decide ZIP implementation**

Preferred: use `fflate` because it is small, browser-friendly, and works in a static app.

Run:

```bash
npm install fflate
```

Expected:
- `package.json` includes `fflate`.
- `package-lock.json` is updated.

If dependency installation is not acceptable, skip this command and implement the fallback manifest-only multi-download path. Do not use server-side ZIP generation.

- [ ] **Step 2: Write failing tests for batch package manifest**

Create `src/export/batchPackage.test.ts`:

```ts
import { createBatchManifest } from './batchPackage';
import type { ConvertArtifact } from '../convert/artifact';

function artifact(fileName: string, kind: ConvertArtifact['kind'], size: number): ConvertArtifact {
  return {
    id: fileName,
    kind,
    fileName,
    mimeType: 'text/plain',
    size,
    text: 'x',
    metadata: {
      title: 'Doc',
      targetId: 'generic',
      includesSourceMarkdown: false,
      includesLocalAssets: false,
      createdAt: '2026-05-15T00:00:00.000Z',
      appVersion: '0.2.0',
    },
  };
}

describe('batch export package', () => {
  it('creates a serializable manifest for multiple artifacts', () => {
    const manifest = createBatchManifest({
      title: 'Doc',
      targetId: 'xiaohongshu',
      artifacts: [artifact('card-1.png', 'png', 100), artifact('doc.pdf', 'pdf', 200)],
      createdAt: '2026-05-15T00:00:00.000Z',
      appVersion: '0.2.0',
    });

    expect(manifest.files.map((file) => file.name)).toEqual(['card-1.png', 'doc.pdf']);
    expect(manifest.totalSize).toBe(300);
  });
});
```

Run: `npm test -- src/export/batchPackage.test.ts`  
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement manifest generation**

Create `src/export/batchPackage.ts`:

```ts
import type { ConvertArtifact, ConvertTargetId } from '../convert/artifact';

export interface BatchManifestFile {
  name: string;
  kind: ConvertArtifact['kind'];
  mimeType: string;
  size: number;
}

export interface BatchManifest {
  format: 'sharkdown-batch-export';
  version: 1;
  title: string;
  targetId: ConvertTargetId;
  createdAt: string;
  appVersion: string;
  totalSize: number;
  files: BatchManifestFile[];
}

export function createBatchManifest(input: {
  title: string;
  targetId: ConvertTargetId;
  artifacts: ConvertArtifact[];
  createdAt: string;
  appVersion: string;
}): BatchManifest {
  return {
    format: 'sharkdown-batch-export',
    version: 1,
    title: input.title,
    targetId: input.targetId,
    createdAt: input.createdAt,
    appVersion: input.appVersion,
    totalSize: input.artifacts.reduce((sum, artifact) => sum + artifact.size, 0),
    files: input.artifacts.map((artifact) => ({
      name: artifact.fileName,
      kind: artifact.kind,
      mimeType: artifact.mimeType,
      size: artifact.size,
    })),
  };
}
```

- [ ] **Step 4: Implement ZIP package creation**

If `fflate` was installed, add:

```ts
import { zipSync, strToU8 } from 'fflate';

export async function createBatchZipBlob(input: {
  manifest: BatchManifest;
  artifacts: ConvertArtifact[];
}): Promise<Blob> {
  const files: Record<string, Uint8Array> = {
    'manifest.json': strToU8(JSON.stringify(input.manifest, null, 2)),
  };

  for (const artifact of input.artifacts) {
    if (artifact.blob) {
      files[artifact.fileName] = new Uint8Array(await artifact.blob.arrayBuffer());
    } else if (artifact.text !== undefined) {
      files[artifact.fileName] = strToU8(artifact.text);
    }
  }

  return new Blob([zipSync(files)], { type: 'application/zip' });
}
```

Add tests that inspect the returned Blob size. If not using `fflate`, export `createBatchManifestBlob` instead and make the UI download individual files plus `manifest.json`.

- [ ] **Step 5: Verify batch package tests**

Run:

```bash
npm test -- src/export/batchPackage.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/export/batchPackage.ts src/export/batchPackage.test.ts
git commit -m "feat: add batch conversion packages"
```

---

### Task 9: Convert Panel UI

**Files:**
- Create: `src/components/convert/ConvertPanel.tsx`
- Create: `src/components/convert/PlatformPresetPicker.tsx`
- Create: `src/components/convert/CarouselPanel.tsx`
- Create: `src/components/convert/PreflightPanel.tsx`
- Create: `src/components/convert/ConvertPanel.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/index.css` only if existing layout needs compact convert-specific styling.

- [ ] **Step 1: Write failing component tests**

Create `src/components/convert/ConvertPanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvertPanel } from './ConvertPanel';

describe('ConvertPanel', () => {
  it('shows platform presets and preflight results', async () => {
    render(
      <ConvertPanel
        markdown={'# Hello\n\nText'}
        renderedHtml={'<h1>Hello</h1><p>Text</p>'}
        estimatedLocalAssetBytes={0}
        onExportArtifacts={vi.fn()}
      />,
    );

    expect(screen.getByText('转换目标')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /小红书图文/ }));
    expect(screen.getByText('导出建议')).toBeInTheDocument();
  });
});
```

Run: `npm test -- src/components/convert/ConvertPanel.test.tsx`  
Expected: FAIL because the component does not exist.

- [ ] **Step 2: Implement compact preset picker**

Create `src/components/convert/PlatformPresetPicker.tsx`:

```tsx
import { listPlatformPresets } from '../../convert/platformPresets';
import type { ConvertTargetId } from '../../convert/artifact';

interface PlatformPresetPickerProps {
  selectedId: ConvertTargetId;
  onSelect: (id: ConvertTargetId) => void;
}

export function PlatformPresetPicker({ selectedId, onSelect }: PlatformPresetPickerProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">转换目标</div>
      <div className="grid grid-cols-2 gap-2">
        {listPlatformPresets().map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            className={[
              'rounded-md border px-3 py-2 text-left text-sm',
              selectedId === preset.id ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 bg-white',
            ].join(' ')}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

Use the existing panel style language from `ThemePanel` and `ExportPanel`: `rounded-lg border border-slate-200 bg-white p-3` for containers, `text-slate-800` for headings, `text-slate-500` for helper text, and `border-teal-700 ring-1 ring-teal-700` for selected choices.

- [ ] **Step 3: Implement preflight panel**

Create `src/components/convert/PreflightPanel.tsx`:

```tsx
import type { ConvertPreflightResult } from '../../convert/convertPreflight';

export function PreflightPanel({ result }: { result: ConvertPreflightResult }) {
  return (
    <section className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">导出建议</div>
      {result.items.length === 0 ? (
        <p className="text-sm text-neutral-600">当前目标没有明显转换风险。</p>
      ) : (
        <ul className="space-y-1">
          {result.items.map((item) => (
            <li key={`${item.code}-${item.message}`} className="rounded-md border border-neutral-200 px-3 py-2 text-sm">
              {item.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Implement carousel panel**

Create `src/components/convert/CarouselPanel.tsx`:

```tsx
import { segmentMarkdownForCards } from '../../convert/segmentMarkdown';

export function CarouselPanel({ markdown }: { markdown: string }) {
  const result = segmentMarkdownForCards(markdown, { maxChars: 700 });

  return (
    <section className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">轮播拆分</div>
      <div className="text-sm text-neutral-700">{result.cards.length} 张卡片</div>
      <ol className="space-y-1">
        {result.cards.map((card) => (
          <li key={card.index} className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm">
            <span>{card.title}</span>
            <span className="text-neutral-500">{card.charCount} 字符</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

- [ ] **Step 5: Implement ConvertPanel composition**

Create `src/components/convert/ConvertPanel.tsx`:

```tsx
import { useMemo, useState } from 'react';
import type { ConvertArtifact, ConvertTargetId } from '../../convert/artifact';
import { runConvertPreflight } from '../../convert/convertPreflight';
import { getPlatformPreset } from '../../convert/platformPresets';
import { CarouselPanel } from './CarouselPanel';
import { PlatformPresetPicker } from './PlatformPresetPicker';
import { PreflightPanel } from './PreflightPanel';

interface ConvertPanelProps {
  markdown: string;
  renderedHtml: string;
  estimatedLocalAssetBytes: number;
  onExportArtifacts: (targetId: ConvertTargetId, kinds: ConvertArtifact['kind'][]) => void;
}

export function ConvertPanel({ markdown, renderedHtml, estimatedLocalAssetBytes, onExportArtifacts }: ConvertPanelProps) {
  const [targetId, setTargetId] = useState<ConvertTargetId>('wechat');
  const preset = getPlatformPreset(targetId);
  const preflight = useMemo(
    () => runConvertPreflight({ markdown, renderedHtml, targetId, estimatedLocalAssetBytes }),
    [markdown, renderedHtml, targetId, estimatedLocalAssetBytes],
  );

  return (
    <section className="space-y-5">
      <PlatformPresetPicker selectedId={targetId} onSelect={setTargetId} />
      <PreflightPanel result={preflight} />
      {(targetId === 'xiaohongshu' || targetId === 'douyin' || targetId === 'slides') && <CarouselPanel markdown={markdown} />}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">格式</div>
        <div className="flex flex-wrap gap-2">
          {preset?.recommendedArtifacts.map((kind) => (
            <button
              key={kind}
              type="button"
              className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
              onClick={() => onExportArtifacts(targetId, [kind])}
            >
              {kind}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Mount ConvertPanel in App**

In `src/app/App.tsx`, add a compact "Convert" panel/tab near existing Share/Template/Export controls. Use the existing preview container ref or rendered preview HTML source if available. If the rendered HTML is not directly available, pass `previewRef.current?.innerHTML ?? ''`.

Do not remove existing export buttons; existing workflows should still be discoverable.

- [ ] **Step 7: Verify component tests**

Run:

```bash
npm test -- src/components/convert/ConvertPanel.test.tsx
npm run lint
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/convert src/app/App.tsx src/index.css
git commit -m "feat: add convert workspace panel"
```

---

### Task 10: Wire Export Actions To Convert Artifacts

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/export/exportImage.ts`
- Modify: `src/export/pdfExport.ts`
- Modify: `src/share/htmlExport.ts`
- Modify: `src/share/clipboardFormats.ts`
- Modify: `src/export/batchPackage.ts`
- Modify: `tests/export.spec.ts`

- [ ] **Step 1: Add Playwright coverage for Convert panel**

Modify `tests/export.spec.ts` with a test that:
- Opens the app.
- Clicks the Convert panel.
- Selects "小红书图文".
- Verifies recommended image formats are visible.
- Selects "微信公众号".
- Verifies HTML/rich-text options are visible.

Use existing selectors and visible text style from the current test file.

Expected test shape:

```ts
test('shows conversion targets and recommended formats', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Convert|转换/ }).click();
  await page.getByRole('button', { name: /小红书图文/ }).click();
  await expect(page.getByRole('button', { name: /png/i })).toBeVisible();
  await page.getByRole('button', { name: /微信公众号/ }).click();
  await expect(page.getByRole('button', { name: /html-fragment/i })).toBeVisible();
});
```

Run: `npx playwright test tests/export.spec.ts`  
Expected: FAIL until the UI is fully wired.

- [ ] **Step 2: Implement `onExportArtifacts` adapter in App**

In `src/app/App.tsx`, add a function that receives target id and artifact kinds. It should:
- Call existing image export for image formats.
- Call existing text PDF export for `pdf`.
- Call existing standalone HTML export for `html`.
- Call `createHtmlFragmentArtifact` and clipboard helper for `html-fragment` or `rich-text`.
- Call Markdown/plain-text copy/download helpers for `markdown` and `plain-text`.
- Call batch package generation for `zip` if multiple artifacts are selected.

Keep every branch user-triggered from a button click.

- [ ] **Step 3: Add user-facing errors**

Use the existing app status/toast mechanism. If the current app uses local state for export messages, add messages such as:
- `已复制微信公众号 HTML 片段。`
- `已生成小红书卡片图片。`
- `当前浏览器不支持直接写入富文本剪贴板，已改为下载 HTML 文件。`

Do not introduce a new notification framework.

- [ ] **Step 4: Verify Playwright test**

Run:

```bash
npx playwright test tests/export.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Verify no existing export regressions**

Run:

```bash
npm test -- src/export src/share src/convert
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/App.tsx src/export src/share src/convert tests/export.spec.ts
git commit -m "feat: wire conversion artifact exports"
```

---

### Task 11: Documentation And Release Notes

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/version.ts`

- [ ] **Step 1: Update README feature scope**

Update README "功能范围" to include:
- Convert panel.
- Platform presets for WeChat, Xiaohongshu, Douyin, Zhihu, GitHub, Notion, Email, Print.
- Carousel/card splitting.
- HTML fragment/rich text conversion.
- Batch export package.
- PDF profiles.
- Target-specific preflight diagnostics.

Keep the offline/privacy model unchanged.

- [ ] **Step 2: Update changelog**

Add the final release entry under `CHANGELOG.md` if it was not already completed in Task 1:

```markdown
## [0.2.0] - 2026-05-15

### Added
- Convert workspace with target presets for common social and document destinations.
- Carousel/card splitting for long Markdown content.
- Target-specific HTML fragment and rich text conversion.
- PDF layout profiles for report, mobile reading, and handout exports.
- Batch export package manifest and ZIP generation.
- Target preflight diagnostics for remote images, long card text, wide tables, raw HTML, formulas, and Mermaid diagrams.

### Changed
- Generated artifacts include the centralized Sharkdown app version.
- README now documents the version and changelog maintenance policy.

### Compatibility
- Sharkdown remains a static offline-first browser app.
- No backend, login, telemetry, cloud storage, or automatic upload flow is introduced.
```

- [ ] **Step 3: Confirm version files are aligned**

Check:

```bash
node -e "const p=require('./package.json'); console.log(p.version)"
```

Expected: `0.2.0`

Check `src/version.ts` manually:

```ts
export const APP_VERSION = '0.2.0';
export const APP_RELEASE_DATE = '2026-05-15';
```

- [ ] **Step 4: Run full verification**

Run:

```bash
npm test
npm run build
npm run lint
npx playwright test
git diff --check
```

Expected:
- All unit tests pass.
- Production build passes.
- Lint passes.
- Playwright passes.
- `git diff --check` reports no whitespace errors.

- [ ] **Step 5: Commit final docs and release metadata**

```bash
git add README.md CHANGELOG.md package.json package-lock.json src/version.ts
git commit -m "docs: document convert release"
```

---

## Acceptance Criteria

- The product remains a static offline Markdown conversion tool.
- No new account, backend, network upload, analytics, billing, or telemetry path exists.
- Users can choose a target platform and see recommended output formats.
- Users can split long Markdown into card/carousel segments before exporting.
- Users can export or copy platform-oriented artifacts: image, text PDF, HTML, HTML fragment, Markdown, plain text, rich text, and batch package.
- PDF settings remain PDF-specific and do not pollute global image/export settings.
- Target preflight diagnostics warn before common conversion failures.
- Version number is maintained in `package.json`, `package-lock.json`, and `src/version.ts`.
- `CHANGELOG.md` records the release.
- README documents the new conversion scope and release maintenance rule.

---

## Verification Commands

Run these before claiming completion:

```bash
npm test
npm run build
npm run lint
npx playwright test
git diff --check
```

If GitHub Pages deployment is part of the handoff, then after pushing also verify the latest GitHub Actions run:

```powershell
(Invoke-RestMethod -Uri "https://api.github.com/repos/Quaternijkon/sharkdown/actions/runs?per_page=1").workflow_runs |
  Select-Object id,name,head_sha,status,conclusion,html_url |
  ConvertTo-Json -Depth 3
```

Expected deployment result: `"conclusion": "success"`.
