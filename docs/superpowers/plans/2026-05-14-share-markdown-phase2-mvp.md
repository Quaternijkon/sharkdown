# Share Markdown Phase 2 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable Phase 2 product slice: an offline Share Markdown workbench with local document management, portable `.sharkdown` packages, self-contained HTML delivery, URL sharing, privacy diagnostics, templates, and a static PWA shell.

**Architecture:** Keep the Vite/React static app. Add focused pure modules under `src/share`, `src/library`, `src/templates`, and `src/pwa`; then connect them through compact panels in the existing three-column UI. Persist normal editing state in the existing store, keep local images in IndexedDB, and use browser-native downloads/clipboard/share APIs with fallbacks.

**Tech Stack:** React 19, TypeScript, Zustand, Vitest/jsdom, Vite, existing local image IndexedDB utilities, browser Clipboard/Web Share APIs, static service worker.

---

### Task 1: Share Core Modules

**Files:**
- Create: `src/share/projectPackage.ts`
- Create: `src/share/htmlExport.ts`
- Create: `src/share/urlShare.ts`
- Create: `src/share/privacyScan.ts`
- Create: `src/share/clipboardFormats.ts`
- Modify: `src/utils/localImages.ts`
- Test: `src/share/projectPackage.test.ts`
- Test: `src/share/htmlExport.test.ts`
- Test: `src/share/urlShare.test.ts`
- Test: `src/share/privacyScan.test.ts`

- [ ] **Step 1: Write failing tests for project package export/import**

Test that `.sharkdown` JSON preserves markdown, settings, metadata, and local image asset records, and that invalid package JSON fails with a user-facing error.

Run: `npm test -- src/share/projectPackage.test.ts`
Expected: FAIL because `src/share/projectPackage.ts` does not exist.

- [ ] **Step 2: Implement project package module**

Add `createProjectPackageBlob`, `parseProjectPackageFile`, `collectLocalImageAssets`, and expose `saveLocalImageAssetRecord` from `src/utils/localImages.ts` so imported packages can restore original `local-image://` ids.

- [ ] **Step 3: Verify project package tests pass**

Run: `npm test -- src/share/projectPackage.test.ts`
Expected: PASS.

- [ ] **Step 4: Write failing tests for self-contained HTML**

Test that standalone HTML includes document title, rendered body markup, theme CSS variables, a privacy note, optional source markdown metadata, and no external script dependency.

Run: `npm test -- src/share/htmlExport.test.ts`
Expected: FAIL because `src/share/htmlExport.ts` does not exist.

- [ ] **Step 5: Implement self-contained HTML artifact creation**

Add `createStandaloneHtml` that accepts rendered preview HTML plus metadata/settings and returns a Blob/text artifact suitable for download.

- [ ] **Step 6: Verify HTML tests pass**

Run: `npm test -- src/share/htmlExport.test.ts`
Expected: PASS.

- [ ] **Step 7: Write failing tests for URL sharing**

Test base64url payload encode/decode, hash URL creation, invalid payload handling, and length warnings.

Run: `npm test -- src/share/urlShare.test.ts`
Expected: FAIL because `src/share/urlShare.ts` does not exist.

- [ ] **Step 8: Implement URL sharing**

Add `encodeSharePayload`, `decodeSharePayload`, `createShareUrl`, `readSharePayloadFromHash`, and `measureShareUrlRisk`.

- [ ] **Step 9: Verify URL sharing tests pass**

Run: `npm test -- src/share/urlShare.test.ts`
Expected: PASS.

- [ ] **Step 10: Write failing tests for privacy scan**

Test detection of local images, remote images, raw HTML, email/phone/token-like strings, large documents, and URL share suitability.

Run: `npm test -- src/share/privacyScan.test.ts`
Expected: FAIL because `src/share/privacyScan.ts` does not exist.

- [ ] **Step 11: Implement privacy scan and clipboard helpers**

Add `scanMarkdownForShare` plus `copyMarkdown`, `copyPlainText`, and `copyRichHtml` helpers with graceful fallback errors.

- [ ] **Step 12: Verify all share core tests pass**

Run: `npm test -- src/share/projectPackage.test.ts src/share/htmlExport.test.ts src/share/urlShare.test.ts src/share/privacyScan.test.ts`
Expected: PASS.

### Task 2: Local Document Library and Templates

**Files:**
- Create: `src/library/documentLibrary.ts`
- Create: `src/library/useLibraryStore.ts`
- Create: `src/templates/shareTemplates.ts`
- Create: `src/library/documentLibrary.test.ts`
- Modify: `src/types.ts`

- [ ] **Step 1: Write failing tests for local document library**

Test create, update, duplicate, archive, restore, search by title/body/tag, migrate current editor state into first document, and stable localStorage persistence.

Run: `npm test -- src/library/documentLibrary.test.ts`
Expected: FAIL because `src/library/documentLibrary.ts` does not exist.

- [ ] **Step 2: Implement local document library**

Use versioned localStorage records for the first Phase 2 slice. Keep each document small and serializable, store settings snapshots, and expose pure helpers plus a Zustand store wrapper.

- [ ] **Step 3: Add share templates**

Create at least 10 built-in templates across social card, README, meeting notes, product update, study notes, slides, email, article, quote card, and release note categories.

- [ ] **Step 4: Verify library tests pass**

Run: `npm test -- src/library/documentLibrary.test.ts`
Expected: PASS.

### Task 3: UI Integration

**Files:**
- Create: `src/components/library/DocumentLibraryPanel.tsx`
- Create: `src/components/share/SharePanel.tsx`
- Create: `src/components/templates/TemplatePanel.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/components/editor/MarkdownEditor.tsx`
- Modify: `src/components/controls/ExportPanel.tsx` only if needed for naming or layout

- [ ] **Step 1: Add document library panel**

Show document list, current document title, new/duplicate/archive/restore actions, search, tags, and explicit save/load actions. Keep it compact above the editor.

- [ ] **Step 2: Add share panel**

Expose download `.sharkdown`, import `.sharkdown`, export self-contained HTML, download `.md`, copy Markdown/plain text/rich HTML, generate/copy URL share link, native share fallback, and privacy scan results.

- [ ] **Step 3: Add template panel**

Expose built-in template choices and apply them to the current editor state with a confirmation-style explicit button.

- [ ] **Step 4: Wire URL payload import**

On app load, parse supported URL hash payloads and import them into the editor without contacting a server.

- [ ] **Step 5: Verify app UI tests/build still pass**

Run: `npm test`
Expected: PASS.

### Task 4: Static PWA Shell

**Files:**
- Create: `public/manifest.webmanifest`
- Create: `public/sw.js`
- Create: `src/pwa/registerServiceWorker.ts`
- Modify: `src/main.tsx`
- Modify: `index.html`

- [ ] **Step 1: Add static manifest and service worker**

Cache the app shell and static assets for offline reopening on GitHub Pages. Use conservative cache versioning.

- [ ] **Step 2: Register service worker**

Register only in production-capable browsers and fail silently with console diagnostics.

- [ ] **Step 3: Verify production build**

Run: `npm run build`
Expected: PASS and `dist/manifest.webmanifest` plus `dist/sw.js` exist.

### Task 5: Final Verification and Delivery

**Files:**
- Modify: `README.md`
- Possibly modify: `Sharkdown二阶段ShareMarkdown产品路线图计划书.md` only if implementation notes need alignment

- [ ] **Step 1: Update README**

Document Phase 2 MVP capabilities, offline/privacy constraints, and local delivery formats.

- [ ] **Step 2: Run full checks**

Run:
- `npm test`
- `npm run build`
- `npm run lint`

Expected: all pass or lint has only pre-existing warnings that are reported explicitly.

- [ ] **Step 3: Browser smoke test**

Start Vite preview or dev server, open local app, verify editor/preview render, document library controls appear, share panel controls appear, and no first-load runtime error is visible.

- [ ] **Step 4: Git status and delivery**

Review `git diff --check`, `git status --short`, then summarize changed files and verification evidence.
