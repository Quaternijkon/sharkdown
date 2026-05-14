export type PdfProfileId = 'a4-report' | 'mobile-reading' | 'handout';

export interface PdfProfile {
  id: PdfProfileId;
  label: string;
  description: string;
  page: {
    size: 'A4' | 'Letter';
    marginTopMm: number;
    marginRightMm: number;
    marginBottomMm: number;
    marginLeftMm: number;
  };
  features: {
    cover: boolean;
    toc: boolean;
    header: boolean;
    footer: boolean;
    printBackground: boolean;
  };
}

const PDF_PROFILES: PdfProfile[] = [
  {
    id: 'a4-report',
    label: 'A4 正式文档',
    description: '适合方案、报告、教程和需要目录的可选择文本 PDF。',
    page: { size: 'A4', marginTopMm: 18, marginRightMm: 16, marginBottomMm: 18, marginLeftMm: 16 },
    features: { cover: true, toc: true, header: true, footer: true, printBackground: true },
  },
  {
    id: 'mobile-reading',
    label: '移动阅读',
    description: '较窄版心和更大留白，适合手机阅读型 PDF。',
    page: { size: 'A4', marginTopMm: 14, marginRightMm: 22, marginBottomMm: 18, marginLeftMm: 22 },
    features: { cover: false, toc: true, header: false, footer: true, printBackground: true },
  },
  {
    id: 'handout',
    label: '讲义',
    description: '适合课程资料、会议材料和打印分发。',
    page: { size: 'A4', marginTopMm: 20, marginRightMm: 20, marginBottomMm: 20, marginLeftMm: 20 },
    features: { cover: true, toc: false, header: true, footer: true, printBackground: false },
  },
];

export function listPdfProfiles(): PdfProfile[] {
  return PDF_PROFILES;
}

export function getPdfProfile(id: PdfProfileId): PdfProfile | undefined {
  return PDF_PROFILES.find((profile) => profile.id === id);
}
