import type { ConvertArtifactKind, ConvertTargetId } from './artifact';

export interface PlatformPreset {
  id: ConvertTargetId;
  label: string;
  description: string;
  delivery: Array<'download' | 'copy' | 'system-share'>;
  requiresNetwork: false;
  recommendedArtifacts: ConvertArtifactKind[];
  canvas: {
    width: number;
    aspectRatio: 'auto' | '1:1' | '4:5' | '9:16' | '16:9' | 'A4';
    padding: number;
  };
  typography: {
    tone: 'serif' | 'sans' | 'mono' | 'system';
    maxLineLength: number;
  };
  warnings: string[];
}

const PRESETS: PlatformPreset[] = [
  {
    id: 'generic',
    label: '通用转换',
    description: '不绑定平台，用于常规 Markdown、图片、HTML 和 PDF 交付。',
    delivery: ['download', 'copy'],
    requiresNetwork: false,
    recommendedArtifacts: ['png', 'pdf', 'markdown', 'html'],
    canvas: { width: 900, aspectRatio: 'auto', padding: 40 },
    typography: { tone: 'system', maxLineLength: 56 },
    warnings: ['跨平台内容建议同时保留 Markdown 源文档。'],
  },
  {
    id: 'wechat',
    label: '微信公众号',
    description: '面向富文本复制和长图备份。',
    delivery: ['copy', 'download'],
    requiresNetwork: false,
    recommendedArtifacts: ['html-fragment', 'rich-text', 'png', 'pdf'],
    canvas: { width: 900, aspectRatio: 'auto', padding: 40 },
    typography: { tone: 'serif', maxLineLength: 38 },
    warnings: ['外部编辑器可能移除部分 CSS，导出前需要预览复制效果。'],
  },
  {
    id: 'xiaohongshu',
    label: '小红书图文',
    description: '适合 1:1 或 4:5 知识卡片与多图轮播。',
    delivery: ['download', 'system-share'],
    requiresNetwork: false,
    recommendedArtifacts: ['png', 'jpeg', 'zip'],
    canvas: { width: 1080, aspectRatio: '4:5', padding: 72 },
    typography: { tone: 'sans', maxLineLength: 24 },
    warnings: ['建议把长文拆成多张卡片，单张不要承载过多文字。'],
  },
  {
    id: 'douyin',
    label: '抖音竖屏',
    description: '适合 9:16 竖屏知识图、封面和图文视频素材。',
    delivery: ['download', 'system-share'],
    requiresNetwork: false,
    recommendedArtifacts: ['png', 'jpeg', 'zip'],
    canvas: { width: 1080, aspectRatio: '9:16', padding: 88 },
    typography: { tone: 'sans', maxLineLength: 20 },
    warnings: ['竖屏内容需要更大的字号和更短的段落。'],
  },
  {
    id: 'zhihu',
    label: '知乎长文',
    description: '适合 Markdown、HTML 片段和文本 PDF。',
    delivery: ['copy', 'download'],
    requiresNetwork: false,
    recommendedArtifacts: ['markdown', 'html-fragment', 'pdf'],
    canvas: { width: 820, aspectRatio: 'auto', padding: 36 },
    typography: { tone: 'serif', maxLineLength: 42 },
    warnings: ['复杂表格和 Mermaid 建议同时导出图片备份。'],
  },
  {
    id: 'github',
    label: 'GitHub README',
    description: '适合纯 Markdown 和代码友好的 HTML 备份。',
    delivery: ['copy', 'download'],
    requiresNetwork: false,
    recommendedArtifacts: ['markdown', 'html', 'pdf'],
    canvas: { width: 980, aspectRatio: 'auto', padding: 32 },
    typography: { tone: 'system', maxLineLength: 80 },
    warnings: ['GitHub 不支持所有 raw HTML 和 Mermaid 语法变体。'],
  },
  {
    id: 'notion',
    label: 'Notion/知识库',
    description: '适合富文本复制、Markdown 和 HTML 片段。',
    delivery: ['copy', 'download'],
    requiresNetwork: false,
    recommendedArtifacts: ['rich-text', 'markdown', 'html-fragment'],
    canvas: { width: 860, aspectRatio: 'auto', padding: 36 },
    typography: { tone: 'system', maxLineLength: 46 },
    warnings: ['粘贴后的块级结构由目标编辑器决定。'],
  },
  {
    id: 'email',
    label: '邮件正文',
    description: '适合稳定、内联样式较少的 HTML 片段和纯文本。',
    delivery: ['copy', 'download'],
    requiresNetwork: false,
    recommendedArtifacts: ['html-fragment', 'plain-text', 'pdf'],
    canvas: { width: 760, aspectRatio: 'auto', padding: 32 },
    typography: { tone: 'system', maxLineLength: 54 },
    warnings: ['邮件客户端会裁剪脚本和部分 CSS，避免复杂布局。'],
  },
  {
    id: 'slides',
    label: '轮播/幻灯片',
    description: '适合把长文拆成多张可分享卡片。',
    delivery: ['download', 'system-share'],
    requiresNetwork: false,
    recommendedArtifacts: ['png', 'zip', 'markdown'],
    canvas: { width: 1280, aspectRatio: '16:9', padding: 72 },
    typography: { tone: 'sans', maxLineLength: 28 },
    warnings: ['每页只保留一个观点，避免卡片过密。'],
  },
  {
    id: 'print',
    label: '打印/PDF',
    description: '适合 A4 文档、讲义、可选择文本 PDF。',
    delivery: ['download'],
    requiresNetwork: false,
    recommendedArtifacts: ['pdf', 'html'],
    canvas: { width: 794, aspectRatio: 'A4', padding: 48 },
    typography: { tone: 'serif', maxLineLength: 52 },
    warnings: ['宽表格需要在导出前检查横向溢出。'],
  },
];

export function listPlatformPresets(): PlatformPreset[] {
  return PRESETS;
}

export function getPlatformPreset(id: ConvertTargetId): PlatformPreset | undefined {
  return PRESETS.find((preset) => preset.id === id);
}
