import { Clipboard, FileArchive, FileText, ImageDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ToolbarButton } from '../common/Toolbar';
import { getPdfProfile, listPdfProfiles, type PdfProfileId } from '../../export/pdfProfiles';
import { settingsFromPdfProfile } from '../../export/pdfExport';
import type {
  ImageExportFormat,
  ImageExportSettings,
  PdfExportSettings,
  PdfOrientation,
  PdfPageSize,
} from '../../types';

type ExportMode = 'image' | 'pdf';

interface ExportPanelProps {
  busy: boolean;
  backgroundColor: string;
  onImageDownload: (settings: ImageExportSettings) => void;
  onCopyImage: (settings: ImageExportSettings) => void;
  onSliceExport: (settings: ImageExportSettings) => void;
  onPdfDownload: (settings: PdfExportSettings) => void;
}

export function ExportPanel({
  busy,
  backgroundColor,
  onImageDownload,
  onCopyImage,
  onSliceExport,
  onPdfDownload,
}: ExportPanelProps) {
  const [mode, setMode] = useState<ExportMode>('image');
  const [imageFormat, setImageFormat] = useState<ImageExportFormat>('png');
  const [imagePixelRatio, setImagePixelRatio] = useState(2);
  const [imageQuality, setImageQuality] = useState(0.92);
  const [sliceHeight, setSliceHeight] = useState(1800);
  const [pdfProfileId, setPdfProfileId] = useState<PdfProfileId>('a4-report');
  const [pageSize, setPageSize] = useState<PdfPageSize>('a4');
  const [orientation, setOrientation] = useState<PdfOrientation>('portrait');
  const [margin, setMargin] = useState(48);
  const [includeToc, setIncludeToc] = useState(true);
  const [includeHeaderFooter, setIncludeHeaderFooter] = useState(true);
  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [title, setTitle] = useState('Sharkdown');
  const selectedPdfProfile = getPdfProfile(pdfProfileId);
  const pdfProfileLabels = useMemo(
    () => Object.fromEntries(listPdfProfiles().map((profile) => [profile.id, profile.label])) as Record<PdfProfileId, string>,
    [],
  );

  const imageSettings = useMemo<ImageExportSettings>(
    () => ({
      format: imageFormat,
      pixelRatio: imagePixelRatio,
      quality: imageQuality,
      sliceHeight,
    }),
    [imageFormat, imagePixelRatio, imageQuality, sliceHeight],
  );

  const pdfSettings = useMemo<PdfExportSettings>(
    () => ({
      pageSize,
      orientation,
      margin,
      includeToc,
      includeHeaderFooter,
      includePageNumbers,
      title,
      backgroundColor,
    }),
    [pageSize, orientation, margin, includeToc, includeHeaderFooter, includePageNumbers, title, backgroundColor],
  );

  function applyPdfProfile(nextProfileId: PdfProfileId) {
    const profile = getPdfProfile(nextProfileId);
    setPdfProfileId(nextProfileId);
    if (!profile) {
      return;
    }
    const profileSettings = settingsFromPdfProfile(profile);
    setPageSize(profileSettings.pageSize);
    setOrientation(profileSettings.orientation);
    setMargin(profileSettings.margin);
    setIncludeToc(profileSettings.includeToc);
    setIncludeHeaderFooter(profileSettings.includeHeaderFooter);
    setIncludePageNumbers(profileSettings.includePageNumbers);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800">导出</h2>
        <div className="grid grid-cols-2 overflow-hidden rounded-md border border-slate-200 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('image')}
            className={mode === 'image' ? 'bg-slate-900 px-3 py-1.5 text-white' : 'px-3 py-1.5 text-slate-600'}
          >
            图片
          </button>
          <button
            type="button"
            onClick={() => setMode('pdf')}
            className={mode === 'pdf' ? 'bg-slate-900 px-3 py-1.5 text-white' : 'px-3 py-1.5 text-slate-600'}
          >
            PDF
          </button>
        </div>
      </div>

      {mode === 'image' ? (
        <div className="space-y-3">
          <OptionGrid
            label="格式"
            options={['png', 'jpeg', 'webp', 'svg'] satisfies ImageExportFormat[]}
            value={imageFormat}
            onChange={setImageFormat}
          />
          <OptionGrid
            label="倍率"
            options={[1, 2, 3]}
            value={imagePixelRatio}
            suffix="x"
            onChange={setImagePixelRatio}
          />
          {(imageFormat === 'jpeg' || imageFormat === 'webp') && (
            <RangeControl
              label="质量"
              min={0.72}
              max={1}
              step={0.01}
              value={imageQuality}
              display={`${Math.round(imageQuality * 100)}%`}
              onChange={setImageQuality}
            />
          )}
          <RangeControl
            label="切片高度"
            min={900}
            max={3600}
            step={100}
            value={sliceHeight}
            display={`${sliceHeight}px`}
            onChange={setSliceHeight}
          />
          <div className="grid grid-cols-2 gap-2">
            <ToolbarButton
              icon={<ImageDown size={16} />}
              label={`下载 ${imageFormat.toUpperCase()}`}
              text={imageFormat.toUpperCase()}
              tone="primary"
              disabled={busy}
              onClick={() => onImageDownload(imageSettings)}
            />
            <ToolbarButton
              icon={<Clipboard size={16} />}
              label="复制 PNG 图片"
              text="复制"
              disabled={busy}
              onClick={() => onCopyImage({ ...imageSettings, format: 'png' })}
            />
          </div>
          <ToolbarButton
            icon={<FileArchive size={16} />}
            label="切片导出 PNG"
            text="切片 PNG"
            disabled={busy}
            onClick={() => onSliceExport({ ...imageSettings, format: 'png' })}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">标题</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-slate-500"
            />
          </label>
          <OptionGrid
            label="PDF 档位"
            options={listPdfProfiles().map((profile) => profile.id)}
            value={pdfProfileId}
            labels={pdfProfileLabels}
            onChange={applyPdfProfile}
          />
          {selectedPdfProfile ? (
            <p className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
              {selectedPdfProfile.description}
            </p>
          ) : null}
          <OptionGrid
            label="页面"
            options={['a4', 'letter'] satisfies PdfPageSize[]}
            value={pageSize}
            onChange={setPageSize}
          />
          <OptionGrid
            label="方向"
            options={['portrait', 'landscape'] satisfies PdfOrientation[]}
            value={orientation}
            labels={{ portrait: '纵向', landscape: '横向' }}
            onChange={setOrientation}
          />
          <RangeControl
            label="页边距"
            min={18}
            max={96}
            step={2}
            value={margin}
            display={`${margin}pt`}
            onChange={setMargin}
          />
          <ToggleControl label="可跳转目录" checked={includeToc} onChange={setIncludeToc} />
          <ToggleControl label="页眉页脚" checked={includeHeaderFooter} onChange={setIncludeHeaderFooter} />
          <ToggleControl label="页码" checked={includePageNumbers} onChange={setIncludePageNumbers} />
          <p className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
            使用浏览器打印生成文字版 PDF，可复制、搜索，并保留链接。打印窗口中选择“另存为 PDF”。
          </p>
          <ToolbarButton
            icon={<FileText size={16} />}
            label="打印或保存 PDF"
            text="保存 PDF"
            tone="primary"
            disabled={busy}
            onClick={() => onPdfDownload(pdfSettings)}
          />
        </div>
      )}
    </section>
  );
}

interface OptionGridProps<T extends string | number> {
  label: string;
  options: T[];
  value: T;
  suffix?: string;
  labels?: Partial<Record<T, string>>;
  onChange: (value: T) => void;
}

function OptionGrid<T extends string | number>({
  label,
  options,
  value,
  suffix,
  labels,
  onChange,
}: OptionGridProps<T>) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-slate-600">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`h-9 rounded-md border text-xs font-medium uppercase ${
              value === option
                ? 'border-teal-700 bg-teal-700 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
            }`}
          >
            {labels?.[option] ?? option}
            {suffix}
          </button>
        ))}
      </div>
    </div>
  );
}

interface RangeControlProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (value: number) => void;
}

function RangeControl({ label, min, max, step, value, display, onChange }: RangeControlProps) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="font-mono text-xs text-slate-500">{display}</span>
      </div>
      <input
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

interface ToggleControlProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleControl({ label, checked, onChange }: ToggleControlProps) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-teal-700"
      />
    </label>
  );
}
