import { Check } from 'lucide-react';

import { useEditorStore } from '../../store/useEditorStore';
import { themePresets } from '../../themes/presets';

export function ThemePanel() {
  const themeId = useEditorStore((state) => state.themeId);
  const updateSettings = useEditorStore((state) => state.updateSettings);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">主题</h2>
      <div className="grid grid-cols-1 gap-2">
        {themePresets.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => updateSettings({ themeId: theme.id })}
            className={`group rounded-md border bg-white p-2 text-left transition hover:border-slate-400 ${
              theme.id === themeId ? 'border-teal-700 ring-1 ring-teal-700' : 'border-slate-200'
            }`}
            aria-pressed={theme.id === themeId}
          >
            <span className="mb-2 flex items-start justify-between gap-2">
              <span className="flex flex-1 overflow-hidden rounded border border-slate-200">
                {(theme.swatches ?? [
                  theme.cssVars['--preview-bg'],
                  theme.cssVars['--preview-accent'],
                  theme.cssVars['--preview-surface'],
                ]).map((color) => (
                  <span key={color} className="h-5 flex-1" style={{ backgroundColor: color }} />
                ))}
              </span>
              {theme.id === themeId ? <Check size={15} className="text-teal-700" /> : null}
            </span>
            <span className="block text-xs font-semibold text-slate-800">{theme.name}</span>
            <span className="mt-1 block text-[11px] leading-4 text-slate-500">{theme.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
