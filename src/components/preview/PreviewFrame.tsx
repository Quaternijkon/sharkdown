import { forwardRef, type CSSProperties } from 'react';

import { MarkdownRenderer } from '../../markdown/MarkdownRenderer';
import { PeopleDailyRenderer } from './PeopleDailyRenderer';
import { useEditorStore } from '../../store/useEditorStore';
import { getThemeById } from '../../themes/presets';

export const PreviewFrame = forwardRef<HTMLDivElement>(function PreviewFrame(_, ref) {
  const markdown = useEditorStore((state) => state.markdown);
  const layoutMode = useEditorStore((state) => state.layoutMode);
  const themeId = useEditorStore((state) => state.themeId);
  const width = useEditorStore((state) => state.width);
  const padding = useEditorStore((state) => state.padding);
  const radius = useEditorStore((state) => state.radius);
  const fontScale = useEditorStore((state) => state.fontScale);
  const background = useEditorStore((state) => state.background);
  const allowRawHtml = useEditorStore((state) => state.allowRawHtml);
  const theme = getThemeById(themeId);

  const isPeopleDailyLayout = layoutMode === 'people-daily';
  const frameStyle = {
    ...theme.cssVars,
    width: `${width}px`,
    padding: isPeopleDailyLayout ? '0' : `${padding}px`,
    borderRadius: isPeopleDailyLayout ? '0' : `${radius}px`,
    fontSize: `${fontScale}rem`,
  } as CSSProperties;
  const frameClassName = isPeopleDailyLayout
    ? 'markdown-export-frame sharkdown-layout-people-daily'
    : `markdown-export-frame sharkdown-prose ${theme.proseClassName ?? ''}`;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <div className="text-sm font-semibold text-slate-800">预览</div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-600">
          {width}px
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0] p-6">
        <div className="flex min-h-full justify-center" style={{ background }}>
          <article
            ref={ref}
            className={frameClassName}
            style={frameStyle}
          >
            {isPeopleDailyLayout ? (
              <PeopleDailyRenderer markdown={markdown || '\u00A0'} />
            ) : (
              <MarkdownRenderer markdown={markdown || '\u00A0'} allowRawHtml={allowRawHtml} />
            )}
          </article>
        </div>
      </div>
    </section>
  );
});
