# Changelog

All notable changes to Sharkdown are recorded here. The app follows practical semantic versioning while it remains a private local tool.

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
