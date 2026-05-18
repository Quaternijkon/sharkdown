# Sharkdown People Daily Layout Mode Design

## Goal

Build a static, offline "People Daily" layout mode for Sharkdown. Markdown remains the input format, but the rendered result must be an automatically typeset newspaper page rather than a Markdown preview with newspaper styling.

## User Direction

The target is the native visual language of People's Daily style newspaper pages:

- red masthead and restrained publication metadata;
- dense serif newspaper typography;
- strict page box, margins, column rules, and hairline separators;
- automatic adaptation to content length;
- multi-story front-page composition only when the source content supports it;
- long-form continuous article layout when one long title or one long article would naturally dominate the page.

The layout must not force Markdown blocks into fixed cards. Markdown syntax only supplies semantic source data.

## Architecture

Add a lightweight layout mode layer on top of the existing preview pipeline:

- `DocumentState.layoutMode` selects `markdown` or `people-daily`.
- `PreviewFrame` keeps the same export ref and switches between the existing `MarkdownRenderer` and a new newspaper renderer.
- `peopleDailyLayout.ts` parses Markdown into content signals and chooses a layout strategy.
- `PeopleDailyRenderer.tsx` renders printable page containers using deterministic CSS, without a backend.

This keeps Sharkdown static and local-first. It avoids introducing a full TeX engine while still behaving like a simple typesetting system.

## Content Model

The layout engine derives a `PeopleDailyDocument` from source Markdown:

- title: first level-1 heading or first meaningful heading;
- subtitle/byline: first quote or short paragraph after title, when suitable;
- sections: level-2/level-3 headings plus following paragraphs;
- paragraphs: non-empty prose blocks;
- images: Markdown image references;
- special blocks: code fences, tables, lists, formulas, quotes.

The renderer does not preserve Markdown visual components directly. It assigns semantic content into newspaper layout roles.

## Layout Selection

The engine chooses one of these variants:

1. `front-page`
   - Used when content has multiple headings or several short sections.
   - Produces a masthead, lead headline, dense story blocks, optional image story, and lower multi-column story.

2. `long-article`
   - Used when the content has one dominant title, few section headings, or long average paragraphs.
   - Produces a masthead, large centered headline, optional subtitle, and continuous multi-column text.
   - If the title or article is too long, the renderer should not force side blocks.

3. `brief`
   - Used for very short content.
   - Produces a compact newspaper-style share page with masthead, headline, and dense summary columns.

The first version can estimate fit with text length and section count. It does not need browser-measured line breaking to be useful.

## Pagination

Pages are fixed-ratio newspaper sheets rendered as stacked DOM nodes.

- Long content is split by paragraph/section boundaries.
- The first page can use a richer front-page composition.
- Overflow content uses continuation pages with masthead, page number, and continuous columns.
- The system should avoid splitting a heading away from its following first paragraph.

## Visual Requirements

People Daily mode should use:

- off-white newsprint background;
- red calligraphic-style masthead;
- Songti/SimSun/Noto Serif CJK serif stack;
- dense line height, narrow columns, justified text;
- thin black and grey rules;
- minimal decoration;
- no rounded cards, gradients, or Markdown-like panels.

## Export Requirements

The existing image/PDF/HTML export path should continue to use `previewRef`.

- Exported images must match preview backgrounds and text colors.
- PDF export should print the newspaper pages as normal DOM content.
- HTML fragment export can include the newspaper DOM for static sharing.

## Related Fixes In This Release

This release also includes the user-requested surrounding fixes:

- remove duplicate editor formatting toolbar and rely on `@uiw/react-md-editor` built-in commands;
- keep document-level editor actions available without duplicating formatting controls;
- fix dark-theme syntax highlighting readability;
- change slogan to `share markdown！`;
- add a GitHub link to `https://github.com/Quaternijkon/sharkdown`;
- bump product version and update README/CHANGELOG.

## Non-Goals

- No backend, account system, cloud sync, or server rendering.
- No full TeX/Typst engine.
- No exact copy of a specific copyrighted newspaper issue.
- No OCR or image-based fake newspaper rendering.

## Acceptance Criteria

- Users can switch between normal Markdown preview and People's Daily layout mode.
- Long Markdown articles render as continuous newspaper pages, not forced blocks.
- Multi-section Markdown renders as dense front-page style composition.
- Preview export target remains compatible with existing export actions.
- Dark code highlighting remains readable in dark themes.
- Header slogan and GitHub link match the request.
- Tests cover layout selection, renderer output, editor toolbar behavior, header link, and code theme selection.
