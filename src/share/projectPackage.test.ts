import { describe, expect, it } from 'vitest';

import { DEFAULT_DOCUMENT_STATE } from '../store/useEditorStore';
import {
  SHARKDOWN_PROJECT_VERSION,
  createProjectPackageBlob,
  parseProjectPackageFile,
} from './projectPackage';

describe('sharkdown project packages', () => {
  it('exports and imports an editable project with settings and local assets', async () => {
    const blob = await createProjectPackageBlob({
      title: 'Roadmap',
      markdown: '# Roadmap\n\n![Chart](local-image://img_1/chart.png)',
      state: { ...DEFAULT_DOCUMENT_STATE, themeId: 'claude', width: 860 },
      assets: [
        {
          id: 'img_1',
          fileName: 'chart.png',
          mimeType: 'image/png',
          size: 4,
          dataUrl: 'data:image/png;base64,AQIDBA==',
        },
      ],
      appVersion: '0.1.0-test',
    });

    expect(blob.type).toBe('application/vnd.sharkdown.project+json');

    const parsed = await parseProjectPackageFile(new File([blob], 'roadmap.sharkdown'));

    expect(parsed.manifest.format).toBe('sharkdown-project');
    expect(parsed.manifest.version).toBe(SHARKDOWN_PROJECT_VERSION);
    expect(parsed.manifest.title).toBe('Roadmap');
    expect(parsed.manifest.appVersion).toBe('0.1.0-test');
    expect(parsed.markdown).toContain('local-image://img_1/chart.png');
    expect(parsed.state.themeId).toBe('claude');
    expect(parsed.state.width).toBe(860);
    expect(parsed.assets).toEqual([
      {
        id: 'img_1',
        fileName: 'chart.png',
        mimeType: 'image/png',
        size: 4,
        dataUrl: 'data:image/png;base64,AQIDBA==',
      },
    ]);
  });

  it('rejects invalid package files with a readable error', async () => {
    await expect(parseProjectPackageFile(new File(['{"format":"wrong"}'], 'bad.sharkdown'))).rejects.toThrow(
      '无法识别的 Sharkdown 工程包。',
    );
  });
});
