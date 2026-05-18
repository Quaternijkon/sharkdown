import { LayoutTemplate, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ToolbarButton } from '../common/Toolbar';
import { getTemplatePresetSettings, SHARE_TEMPLATES } from '../../templates/shareTemplates';
import { useEditorStore } from '../../store/useEditorStore';

interface TemplatePanelProps {
  onNotice: (message: string, tone?: 'info' | 'success' | 'error') => void;
}

export function TemplatePanel({ onNotice }: TemplatePanelProps) {
  const [selectedId, setSelectedId] = useState(SHARE_TEMPLATES[0]?.id ?? '');
  const setMarkdown = useEditorStore((state) => state.setMarkdown);
  const updateSettings = useEditorStore((state) => state.updateSettings);
  const selectedTemplate = useMemo(
    () => SHARE_TEMPLATES.find((template) => template.id === selectedId) ?? SHARE_TEMPLATES[0],
    [selectedId],
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <LayoutTemplate size={17} />
          <span>分享模板</span>
        </div>
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={<RotateCcw size={16} />}
            label="恢复预设参数"
            text="重置"
            onClick={() => {
              if (!selectedTemplate) {
                return;
              }
              updateSettings(getTemplatePresetSettings(selectedTemplate));
              onNotice(`已恢复模板预设参数：${selectedTemplate.name}`, 'success');
            }}
          />
          <ToolbarButton
            icon={<LayoutTemplate size={16} />}
            label="应用模板"
            text="应用"
            onClick={() => {
              if (!selectedTemplate) {
                return;
              }
              setMarkdown(selectedTemplate.markdown);
              updateSettings(getTemplatePresetSettings(selectedTemplate));
              onNotice(`已应用模板：${selectedTemplate.name}`, 'success');
            }}
          />
        </div>
      </div>
      <select
        value={selectedId}
        onChange={(event) => setSelectedId(event.target.value)}
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-slate-500"
      >
        {SHARE_TEMPLATES.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
      {selectedTemplate ? (
        <div className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
          <div>{selectedTemplate.description}</div>
          <div className="mt-1 text-slate-500">
            建议：{selectedTemplate.recommendedArtifacts.join(' / ')}
          </div>
        </div>
      ) : null}
    </section>
  );
}
