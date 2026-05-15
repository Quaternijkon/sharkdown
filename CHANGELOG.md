# Changelog

All notable changes to Sharkdown are recorded here. The app follows practical semantic versioning while it remains a private local tool.

## [1.2.0] - 2026-05-16

### Added

- Main workspace now uses a three-column layout: left Markdown editor, center rendered preview, and right activity sidebar.
- Right activity sidebar now separates major work modes into independent views: conversion/export, visual style, Markdown analysis, and local file system.
- Desktop workspace columns can be resized with vertical drag handles between editor/preview and preview/sidebar.
- Right sidebar can be collapsed to its activity rail while preserving quick access to each panel.
- Offline Markdown analysis now reports richer document statistics: line count, effective lines, character/word count, reading time, headings, lists, tasks, links, images, tables, formulas, code blocks, blockquotes, syntax coverage, and heading depth.
- Markdown analysis now includes share-readiness and readability scores, strengths, and local improvement recommendations.
- Analysis view now has a standalone dashboard with document profile, score bars, syntax coordinate map, content composition, task progress, code language distribution, section distribution, and insight cards.

### Changed

- Local document library moved out of the editor column and into the right sidebar file-system view, so the editor stays focused on writing.
- Theme, canvas size, and templates moved into the right sidebar style view.
- Convert, export, and share controls are grouped under the right sidebar conversion/export view.
- Playwright coverage now checks sidebar tabs, resizable separators, and the upgraded analysis view.

### Compatibility

- Still a static offline-first browser app. The new workspace layout, sidebar, resizing behavior, and richer analysis are all local browser features with no backend, sync account, telemetry, or upload flow.

## [1.1.0] - 2026-05-15

### Added

- Markdown editor now uses `@uiw/react-md-editor` and adds Sharkdown's own compact formatting toolbar for bold, italic, strikethrough, inline code, code blocks, headings, quotes, lists, task lists, links, and tables.
- Selected Markdown text now has a right-click quick formatting menu for common inline and block commands.
- Local document library now has a lightweight virtual file tree with nested folders, folder collapse state, selected-folder creation, folder rename, safe folder removal, and document move-to-folder controls.
- Document library search now matches virtual folder names as well as document title, body, and tags.
- Offline Markdown analysis panel with syntax-map highlighting, main insights, code language detection, task completion progress, section distribution, and heuristic structure/completeness/visualization scores.

### Fixed

- Image export now reads the actual computed background of the rendered preview node before generating PNG/JPEG/WebP/SVG. Dark themes such as Douyin and black-gold no longer export with a white background behind light text.

### Changed

- Document library backups now preserve the version-3 virtual folder model while continuing to use the existing browser storage key for in-place migration.
- README and release metadata now describe the editor, file tree, analysis panel, and current verification commands.

### Compatibility

- Still a static offline-first browser app. The new editor, virtual file tree, image export fix, and Markdown analysis all run locally in the browser with no backend, sync account, telemetry, or upload flow.

## [0.3.1] - 2026-05-15

### Fixed

- Document library JSON backups now include referenced `local-image://` assets when those assets still exist in the browser IndexedDB cache, so local backups can restore Markdown documents with embedded local images during browser backup or device migration.
- Document library backup import now restores bundled local image assets before merging documents, preventing restored documents from showing broken local-image references after migration.

### Compatibility

- Still a static offline-first browser app. The backup file remains a user-triggered local JSON download/upload and no backend, sync account, telemetry, or upload flow is introduced.

## [0.3.0] - 2026-05-15

### Added

- Root `tile_r1_c1.png` has been adopted as the web app logo, favicon, manifest icon, header mark, and service worker cached shell asset.
- Local document library now exposes document title and tag editing, saved/unsaved status, clearer current document handling, and an explicit archive section.
- Portable document library backup export as JSON for local backup and device migration.
- Portable document library backup import with merge semantics: new documents are added, newer imported conflicts update local records, and newer local conflicts are kept.
- Regression coverage for library backup import/export, unsaved-change detection, document library panel behavior, and logo asset wiring.

### Changed

- Document library UI is still a compact local panel, but now treats the current document as an explicit saved draft instead of a hidden side effect of the editor.

### Compatibility

- Still a static offline-first browser app. Document backups are user-triggered local JSON downloads/uploads; no backend, account system, telemetry, or upload flow is introduced.

## [0.2.0] - 2026-05-15

### Added

- Convert workspace with target presets for common social and document destinations.
- Platform presets for WeChat, Xiaohongshu, Douyin, Zhihu, GitHub, Notion, Email, Print, slides, and generic conversion.
- Carousel/card splitting for long Markdown content.
- Target-specific HTML fragment and rich text conversion.
- PDF layout profiles for report, mobile reading, and handout exports.
- Batch export package manifest and ZIP generation.
- Target preflight diagnostics for remote images, long card text, wide tables, raw HTML, formulas, Mermaid diagrams, local asset size, and sensitive content.

### Changed

- App version is centralized in `src/version.ts` and written into generated artifacts.
- README now documents the conversion scope and release maintenance policy.

### Compatibility

- Still a static offline-first browser app. No backend, account system, telemetry, or upload flow is introduced.

## [0.1.0] - 2026-05-15

### Added

- Offline Share Markdown workbench with Markdown editing, realtime preview, local document library, themes, image export, text PDF export, `.sharkdown` packages, standalone HTML export, URL fragment sharing, privacy scan, built-in templates, and a static PWA shell.
- Local-first privacy model: user Markdown, images, settings, templates, and exported artifacts stay in the browser unless the user explicitly downloads, copies, or shares them.

### Compatibility

- Static GitHub Pages deployment.
- No backend, account system, cloud sync, telemetry, or automatic upload flow.
