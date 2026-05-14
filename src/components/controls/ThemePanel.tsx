import { Check } from 'lucide-react';

import { useEditorStore } from '../../store/useEditorStore';
import { themePresets } from '../../themes/presets';

export function ThemePanel() {
  const themeId = useEditorStore((state) => state.themeId);
  const updateSettings = useEditorStore((state) => state.updateSettings);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">主题</h2>
      <div className="grid grid-cols-2 gap-2">
        {themePresets.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => updateSettings({ themeId: theme.id })}
            className="group rounded-md border border-slate-200 bg-white p-2 text-left transition hover:border-slate-400"
            aria-pressed={theme.id === themeId}
          >
            <span className="mb-2 flex items-center gap-1">
              <span
                className="h-5 flex-1 rounded border border-slate-200"
                style={{
                  background: `linear-gradient(90deg, ${theme.cssVars['--preview-bg']} 0 48%, ${theme.cssVars['--preview-accent']} 48% 72%, ${theme.cssVars['--preview-surface']} 72%)`,
                }}
              />
              {theme.id === themeId ? <Check size={15} className="text-teal-700" /> : null}
            </span>
            <span className="block text-xs font-medium text-slate-700">{theme.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
