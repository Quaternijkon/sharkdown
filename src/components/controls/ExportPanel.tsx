import { Clipboard, Download, FileArchive, ImageDown } from 'lucide-react';

import { ToolbarButton } from '../common/Toolbar';
import type { ExportFormat } from '../../types';

interface ExportPanelProps {
  busy: boolean;
  onDownload: (format: ExportFormat) => void;
  onCopyImage: () => void;
  onSliceExport: () => void;
}

export function ExportPanel({ busy, onDownload, onCopyImage, onSliceExport }: ExportPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">导出</h2>
      <div className="grid grid-cols-2 gap-2">
        <ToolbarButton
          icon={<ImageDown size={16} />}
          label="下载 PNG"
          text="PNG"
          tone="primary"
          disabled={busy}
          onClick={() => onDownload('png')}
        />
        <ToolbarButton
          icon={<Download size={16} />}
          label="下载 JPEG"
          text="JPEG"
          disabled={busy}
          onClick={() => onDownload('jpeg')}
        />
        <ToolbarButton
          icon={<Download size={16} />}
          label="下载 SVG"
          text="SVG"
          disabled={busy}
          onClick={() => onDownload('svg')}
        />
        <ToolbarButton
          icon={<Clipboard size={16} />}
          label="复制图片"
          text="复制"
          disabled={busy}
          onClick={onCopyImage}
        />
      </div>
      <div className="mt-2">
        <ToolbarButton
          icon={<FileArchive size={16} />}
          label="切片导出 PNG"
          text="切片 PNG"
          disabled={busy}
          onClick={onSliceExport}
        />
      </div>
    </section>
  );
}
