import { describe, expect, it } from 'vitest';

import { clampWorkspaceColumns } from './workspaceLayout';

describe('clampWorkspaceColumns', () => {
  it('keeps editor, preview, and sidebar widths within practical desktop bounds', () => {
    expect(clampWorkspaceColumns({ editor: 120, preview: 240, sidebar: 120 })).toEqual({
      editor: 320,
      preview: 420,
      sidebar: 300,
    });

    expect(clampWorkspaceColumns({ editor: 900, preview: 1200, sidebar: 760 })).toEqual({
      editor: 720,
      preview: 1040,
      sidebar: 560,
    });
  });
});
