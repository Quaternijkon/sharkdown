import { describe, expect, it } from 'vitest';

import { SHARE_TEMPLATES, getTemplateById } from './shareTemplates';

describe('share templates', () => {
  it('ships a broad set of offline share scenarios', () => {
    expect(SHARE_TEMPLATES.length).toBeGreaterThanOrEqual(10);
    expect(new Set(SHARE_TEMPLATES.map((template) => template.id)).size).toBe(SHARE_TEMPLATES.length);
    expect(SHARE_TEMPLATES.map((template) => template.category)).toEqual(
      expect.arrayContaining(['social', 'technical', 'work', 'reading', 'presentation']),
    );
  });

  it('returns templates by stable id', () => {
    const template = getTemplateById('meeting-notes');

    expect(template?.name).toBe('会议纪要');
    expect(template?.markdown).toContain('## 结论');
    expect(template?.recommendedArtifacts).toContain('pdf');
  });
});
