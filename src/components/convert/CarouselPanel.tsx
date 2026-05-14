import { segmentMarkdownForCards } from '../../convert/segmentMarkdown';

export function CarouselPanel({ markdown }: { markdown: string }) {
  const result = segmentMarkdownForCards(markdown, { maxChars: 700 });

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">轮播拆分</div>
        <span className="font-mono text-[11px] text-slate-500">{result.sourceCharCount} chars</span>
      </div>
      <div className="text-sm font-medium text-slate-700">{result.cards.length} 张卡片</div>
      <ol className="space-y-1">
        {result.cards.slice(0, 6).map((card) => (
          <li
            key={card.index}
            className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-xs"
          >
            <span className="min-w-0 truncate text-slate-700">{card.title}</span>
            <span className={card.warnings.includes('too-long') ? 'text-amber-700' : 'text-slate-500'}>
              {card.charCount}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
