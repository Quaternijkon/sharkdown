import { listPlatformPresets } from '../../convert/platformPresets';
import type { ConvertTargetId } from '../../convert/artifact';

interface PlatformPresetPickerProps {
  selectedId: ConvertTargetId;
  onSelect: (id: ConvertTargetId) => void;
}

export function PlatformPresetPicker({ selectedId, onSelect }: PlatformPresetPickerProps) {
  return (
    <section className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">转换目标</div>
      <div className="grid grid-cols-2 gap-2">
        {listPlatformPresets().map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-pressed={selectedId === preset.id}
            onClick={() => onSelect(preset.id)}
            className={[
              'min-h-12 rounded-md border px-3 py-2 text-left text-xs transition',
              selectedId === preset.id
                ? 'border-teal-700 bg-teal-50 text-slate-950 ring-1 ring-teal-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400',
            ].join(' ')}
          >
            <span className="block font-semibold">{preset.label}</span>
            <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{preset.canvas.aspectRatio}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
