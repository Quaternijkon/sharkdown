import { useMemo, useState } from 'react';
import { FileArchive, RefreshCw } from 'lucide-react';

import type { ConvertArtifact, ConvertTargetId } from '../../convert/artifact';
import { runConvertPreflight } from '../../convert/convertPreflight';
import { getPlatformPreset } from '../../convert/platformPresets';
import { CarouselPanel } from './CarouselPanel';
import { PlatformPresetPicker } from './PlatformPresetPicker';
import { PreflightPanel } from './PreflightPanel';

interface ConvertPanelProps {
  markdown: string;
  renderedHtml: string;
  estimatedLocalAssetBytes: number;
  busy: boolean;
  onExportArtifacts: (targetId: ConvertTargetId, kinds: ConvertArtifact['kind'][]) => void;
}

export function ConvertPanel({
  markdown,
  renderedHtml,
  estimatedLocalAssetBytes,
  busy,
  onExportArtifacts,
}: ConvertPanelProps) {
  const [targetId, setTargetId] = useState<ConvertTargetId>('wechat');
  const preset = getPlatformPreset(targetId);
  const preflight = useMemo(
    () => runConvertPreflight({ markdown, renderedHtml, targetId, estimatedLocalAssetBytes }),
    [markdown, renderedHtml, targetId, estimatedLocalAssetBytes],
  );
  const showCarousel = targetId === 'xiaohongshu' || targetId === 'douyin' || targetId === 'slides';

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <RefreshCw size={16} />
          <span>Convert</span>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">离线</span>
      </div>
      <div className="space-y-5">
        <PlatformPresetPicker selectedId={targetId} onSelect={setTargetId} />
        <PreflightPanel result={preflight} />
        {showCarousel ? <CarouselPanel markdown={markdown} /> : null}
        <section className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">格式</div>
          <div className="flex flex-wrap gap-2">
            {preset?.recommendedArtifacts.map((kind) => (
              <button
                key={kind}
                type="button"
                disabled={busy}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => onExportArtifacts(targetId, [kind])}
              >
                {kind === 'zip' ? <FileArchive size={14} /> : null}
                <span>{kind}</span>
              </button>
            ))}
          </div>
          <p className="text-xs leading-5 text-slate-500">{preset?.description}</p>
        </section>
      </div>
    </section>
  );
}
