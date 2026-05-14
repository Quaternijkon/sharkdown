import { Check } from 'lucide-react';

import { useEditorStore } from '../../store/useEditorStore';
import { themePresets } from '../../themes/presets';

export function ThemePanel() {
  const themeId = useEditorStore((state) => state.themeId);
  const updateSettings = useEditorStore((state) => state.updateSettings);
  const selectedTheme = themePresets.find((theme) => theme.id === themeId) ?? themePresets[0];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800">主题</h2>
        <div className="min-w-0 text-right">
          <div className="truncate text-xs font-semibold text-slate-800">{selectedTheme.name}</div>
          <div className="text-[11px] text-slate-500">当前</div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2" role="list" aria-label="主题列表">
        {themePresets.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => updateSettings({ themeId: theme.id })}
            className={`group relative min-h-14 rounded-md border bg-white p-1.5 text-left transition hover:border-slate-400 ${
              theme.id === themeId ? 'border-teal-700 ring-1 ring-teal-700' : 'border-slate-200'
            }`}
            aria-label={`选择主题：${theme.name}`}
            aria-pressed={theme.id === themeId}
            title={`${theme.name} - ${theme.description}`}
          >
            <span className="flex h-5 overflow-hidden rounded border border-slate-200">
              {(theme.swatches ?? [
                theme.cssVars['--preview-bg'],
                theme.cssVars['--preview-accent'],
                theme.cssVars['--preview-surface'],
              ]).map((color) => (
                <span key={color} className="flex-1" style={{ backgroundColor: color }} />
              ))}
            </span>
            <span className="mt-1 block truncate text-[10px] font-semibold leading-4 text-slate-800">
              {theme.name.split(' ')[0] || theme.name}
            </span>
            {theme.id === themeId ? (
              <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-white text-teal-700 shadow-sm">
                <Check size={12} />
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
