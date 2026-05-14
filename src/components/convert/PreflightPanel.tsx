import type { ConvertPreflightItem, ConvertPreflightResult } from '../../convert/convertPreflight';

export function PreflightPanel({ result }: { result: ConvertPreflightResult }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">导出建议</div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">{severityLabel(result.severity)}</span>
      </div>
      {result.items.length === 0 ? (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
          当前目标没有明显转换风险。
        </p>
      ) : (
        <ul className="space-y-1">
          {result.items.slice(0, 5).map((item) => (
            <li
              key={`${item.code}-${item.message}`}
              className={`rounded-md border px-3 py-2 text-xs leading-5 ${itemTone(item)}`}
            >
              {item.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function severityLabel(severity: ConvertPreflightResult['severity']): string {
  if (severity === 'error') {
    return '需复核';
  }
  if (severity === 'warning') {
    return '有风险';
  }
  if (severity === 'info') {
    return '提示';
  }
  return 'OK';
}

function itemTone(item: ConvertPreflightItem): string {
  if (item.severity === 'error') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }
  if (item.severity === 'warning') {
    return 'border-amber-200 bg-amber-50 text-amber-800';
  }
  return 'border-slate-200 bg-slate-50 text-slate-600';
}
