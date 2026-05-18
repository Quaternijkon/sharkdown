import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TemplatePanel } from './TemplatePanel';
import { DEFAULT_DOCUMENT_STATE, useEditorStore } from '../../store/useEditorStore';
import { getTemplateById, getTemplatePresetSettings } from '../../templates/shareTemplates';

describe('TemplatePanel', () => {
  beforeEach(() => {
    localStorage.clear();
    useEditorStore.setState(DEFAULT_DOCUMENT_STATE);
  });

  it('restores selected template preset parameters without replacing current markdown', () => {
    const template = getTemplateById('social-card');
    expect(template).toBeDefined();

    useEditorStore.setState({
      ...DEFAULT_DOCUMENT_STATE,
      markdown: '# Current draft',
      themeId: 'gpt',
      width: 960,
      padding: 12,
      radius: 2,
      fontScale: 1.3,
      background: '#111111',
    });

    render(<TemplatePanel onNotice={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '恢复预设参数' }));

    expect(useEditorStore.getState().markdown).toBe('# Current draft');
    expect(useEditorStore.getState()).toMatchObject(getTemplatePresetSettings(template!));
  });
});
