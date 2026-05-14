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

- Offline Share Markdown workbench with Markdown editing, realtime preview, local document library, themes, image export, text PDF export, `.sharkdown` packages, standalone HTML export, URL fragment sharing, privacy scan, built-in templates, and a static PWA shell.
- Local-first privacy model: user Markdown, images, settings, templates, and exported artifacts stay in the browser unless the user explicitly downloads, copies, or shares them.

### Compatibility

- Static GitHub Pages deployment.
- No backend, account system, cloud sync, telemetry, or automatic upload flow.
