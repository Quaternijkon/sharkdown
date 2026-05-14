import { useId } from 'react';

import { useEditorStore } from '../../store/useEditorStore';

export function SizePanel() {
  const state = useEditorStore();
  const updateSettings = useEditorStore((store) => store.updateSettings);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">画布</h2>
      <div className="space-y-4">
        <RangeControl
          label="宽度"
          min={360}
          max={1080}
          step={20}
          value={state.width}
          suffix="px"
          onChange={(width) => updateSettings({ width })}
        />
        <RangeControl
          label="边距"
          min={16}
          max={96}
          step={4}
          value={state.padding}
          suffix="px"
          onChange={(padding) => updateSettings({ padding })}
        />
        <RangeControl
          label="圆角"
          min={0}
          max={40}
          step={2}
          value={state.radius}
          suffix="px"
          onChange={(radius) => updateSettings({ radius })}
        />
        <RangeControl
          label="字号"
          min={0.85}
          max={1.25}
          step={0.05}
          value={state.fontScale}
          suffix="x"
          onChange={(fontScale) => updateSettings({ fontScale })}
        />
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-slate-600">像素倍率</span>
            <span className="font-mono text-xs text-slate-500">{state.pixelRatio}x</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => updateSettings({ pixelRatio: ratio })}
                className={`h-9 rounded-md border text-sm font-medium ${
                  state.pixelRatio === ratio
                    ? 'border-teal-700 bg-teal-700 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                }`}
              >
                {ratio}x
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-slate-600">背景</span>
          <input
            type="color"
            value={state.background}
            onChange={(event) => updateSettings({ background: event.target.value })}
            className="h-9 w-14 rounded-md border border-slate-200 bg-white p-1"
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2">
          <span className="text-xs font-medium text-slate-700">Raw HTML</span>
          <input
            type="checkbox"
            checked={state.allowRawHtml}
            onChange={(event) => updateSettings({ allowRawHtml: event.target.checked })}
            className="h-4 w-4 accent-teal-700"
          />
        </label>
      </div>
    </section>
  );
}

interface RangeControlProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  suffix: string;
  onChange: (value: number) => void;
}

function RangeControl({ label, min, max, step, value, suffix, onChange }: RangeControlProps) {
  const id = useId();

  return (
    <label htmlFor={id} className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="font-mono text-xs text-slate-500">
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-teal-700"
      />
    </label>
  );
}
