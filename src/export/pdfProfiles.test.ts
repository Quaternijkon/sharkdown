import { describe, expect, it } from 'vitest';

import { getPdfProfile, listPdfProfiles } from './pdfProfiles';

describe('pdf profiles', () => {
  it('provides practical text-pdf layouts', () => {
    expect(listPdfProfiles().map((profile) => profile.id)).toEqual(
      expect.arrayContaining(['a4-report', 'mobile-reading', 'handout']),
    );
    expect(getPdfProfile('a4-report')?.page.marginTopMm).toBeGreaterThan(0);
  });

  it('keeps profiles serializable', () => {
    expect(() => JSON.stringify(listPdfProfiles())).not.toThrow();
  });
});
