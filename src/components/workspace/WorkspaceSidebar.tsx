import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';

export interface WorkspaceSidebarPanel {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface WorkspaceSidebarProps {
  panels: WorkspaceSidebarPanel[];
  initialPanelId?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function WorkspaceSidebar({
  panels,
  initialPanelId,
  collapsed: controlledCollapsed,
  onCollapsedChange,
}: WorkspaceSidebarProps) {
  const [activePanelId, setActivePanelId] = useState(initialPanelId ?? panels[0]?.id);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const activePanel = panels.find((panel) => panel.id === activePanelId) ?? panels[0];

  function updateCollapsed(nextCollapsed: boolean) {
    if (controlledCollapsed === undefined) {
      setInternalCollapsed(nextCollapsed);
    }
    onCollapsedChange?.(nextCollapsed);
  }

  function selectPanel(panelId: string) {
    setActivePanelId(panelId);
    if (collapsed) {
      updateCollapsed(false);
    }
  }

  return (
    <aside className="flex min-h-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-slate-100">
      <div className="flex w-14 shrink-0 flex-col items-center border-r border-slate-800 bg-slate-950 py-2" role="tablist">
        {panels.map((panel) => (
          <button
            key={panel.id}
            type="button"
            role="tab"
            aria-selected={!collapsed && activePanel?.id === panel.id}
            aria-controls={`workspace-panel-${panel.id}`}
            title={panel.label}
            aria-label={panel.label}
            onClick={() => selectPanel(panel.id)}
            className={`mb-1 inline-flex h-11 w-11 items-center justify-center rounded-md border text-slate-300 transition ${
              activePanel?.id === panel.id && !collapsed
                ? 'border-teal-400 bg-teal-400/15 text-teal-100'
                : 'border-transparent hover:border-slate-700 hover:bg-slate-900 hover:text-white'
            }`}
          >
            {panel.icon ?? <span className="text-xs font-semibold">{panel.label.slice(0, 1)}</span>}
          </button>
        ))}
        <button
          type="button"
          aria-label={collapsed ? '展开右侧栏' : '折叠右侧栏'}
          title={collapsed ? '展开右侧栏' : '折叠右侧栏'}
          onClick={() => updateCollapsed(!collapsed)}
          className="mt-auto inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-400 hover:bg-slate-900 hover:text-white"
        >
          {collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {!collapsed && activePanel ? (
        <div
          id={`workspace-panel-${activePanel.id}`}
          role="tabpanel"
          aria-label={activePanel.label}
          className="min-w-0 flex-1 overflow-auto bg-slate-100 p-3 text-slate-900"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-800">{activePanel.label}</h2>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500">
              本地离线
            </span>
          </div>
          <div className="space-y-3">{activePanel.content}</div>
        </div>
      ) : null}
    </aside>
  );
}
