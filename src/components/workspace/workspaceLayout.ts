export interface WorkspaceColumnWidths {
  editor: number;
  preview: number;
  sidebar: number;
}

const COLUMN_LIMITS = {
  editor: { min: 320, max: 720 },
  preview: { min: 420, max: 1040 },
  sidebar: { min: 300, max: 560 },
} satisfies Record<keyof WorkspaceColumnWidths, { min: number; max: number }>;

export const DEFAULT_WORKSPACE_COLUMNS: WorkspaceColumnWidths = {
  editor: 400,
  preview: 620,
  sidebar: 360,
};

export const COLLAPSED_SIDEBAR_WIDTH = 58;

export function clampWorkspaceColumns(widths: WorkspaceColumnWidths): WorkspaceColumnWidths {
  return {
    editor: clamp(widths.editor, COLUMN_LIMITS.editor.min, COLUMN_LIMITS.editor.max),
    preview: clamp(widths.preview, COLUMN_LIMITS.preview.min, COLUMN_LIMITS.preview.max),
    sidebar: clamp(widths.sidebar, COLUMN_LIMITS.sidebar.min, COLUMN_LIMITS.sidebar.max),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}
