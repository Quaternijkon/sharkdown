export type ShareTemplateCategory = 'social' | 'technical' | 'work' | 'reading' | 'presentation';
export type ShareArtifactKind = 'png' | 'pdf' | 'html' | 'markdown' | 'sharkdown' | 'slides';

export interface ShareTemplate {
  id: string;
  name: string;
  category: ShareTemplateCategory;
  description: string;
  markdown: string;
  themeId: string;
  recommendedArtifacts: ShareArtifactKind[];
}

export type ShareTemplatePresetSettings = {
  themeId: string;
  width: number;
  padding: number;
  radius: number;
  fontScale: number;
  background: string;
  allowRawHtml: boolean;
};

const DEFAULT_TEMPLATE_PRESET_SETTINGS: ShareTemplatePresetSettings = {
  themeId: 'claude',
  width: 720,
  padding: 48,
  radius: 18,
  fontScale: 1,
  background: '#ffffff',
  allowRawHtml: false,
};

export const SHARE_TEMPLATES: ShareTemplate[] = [
  {
    id: 'social-card',
    name: '社交知识卡',
    category: 'social',
    description: '适合发到聊天窗口或社交平台的短卡片。',
    themeId: 'douyin',
    recommendedArtifacts: ['png', 'html'],
    markdown: '# 一个清晰观点\n\n> 用一句话先给结论。\n\n- 证据一\n- 证据二\n- 行动建议',
  },
  {
    id: 'quote-card',
    name: '引用卡片',
    category: 'social',
    description: '适合摘录、金句和读书卡。',
    themeId: 'claude',
    recommendedArtifacts: ['png'],
    markdown: '# 引用\n\n> 把值得保留的话放在这里。\n\n出处：书名 / 文章 / 访谈',
  },
  {
    id: 'technical-readme',
    name: '技术 README',
    category: 'technical',
    description: '适合项目说明、安装和快速开始。',
    themeId: 'github',
    recommendedArtifacts: ['markdown', 'html'],
    markdown: '# Project Name\n\n## Quick Start\n\n```bash\nnpm install\nnpm run dev\n```\n\n## Features\n\n- Feature A\n- Feature B\n\n## License\n\nPrivate use.',
  },
  {
    id: 'api-note',
    name: '接口说明',
    category: 'technical',
    description: '适合分享接口、参数和响应示例。',
    themeId: 'gpt',
    recommendedArtifacts: ['html', 'markdown'],
    markdown: '# API Note\n\n## Endpoint\n\n`POST /api/example`\n\n## Request\n\n```json\n{"name":"demo"}\n```\n\n## Response\n\n```json\n{"ok":true}\n```',
  },
  {
    id: 'meeting-notes',
    name: '会议纪要',
    category: 'work',
    description: '适合会后同步结论、行动项和风险。',
    themeId: 'apple',
    recommendedArtifacts: ['pdf', 'html', 'markdown'],
    markdown: '# 会议纪要\n\n## 结论\n\n- 结论一\n- 结论二\n\n## 行动项\n\n- [ ] 负责人 / 截止时间 / 事项\n\n## 风险\n\n- 风险与应对',
  },
  {
    id: 'product-update',
    name: '产品更新',
    category: 'work',
    description: '适合发布 changelog 和内部更新。',
    themeId: 'google',
    recommendedArtifacts: ['html', 'pdf'],
    markdown: '# 产品更新\n\n## 本次变化\n\n- 新增：\n- 优化：\n- 修复：\n\n## 影响范围\n\n## 下一步',
  },
  {
    id: 'study-note',
    name: '学习笔记',
    category: 'reading',
    description: '适合知识整理和复习。',
    themeId: 'claude',
    recommendedArtifacts: ['html', 'pdf'],
    markdown: '# 学习笔记\n\n## 核心概念\n\n## 我的理解\n\n## 例子\n\n## 仍需查证',
  },
  {
    id: 'long-article',
    name: '长文阅读',
    category: 'reading',
    description: '适合沉浸式阅读和打印。',
    themeId: 'paper',
    recommendedArtifacts: ['html', 'pdf'],
    markdown: '# 文章标题\n\n## 引言\n\n## 第一部分\n\n## 第二部分\n\n## 结语',
  },
  {
    id: 'slide-deck',
    name: '幻灯片大纲',
    category: 'presentation',
    description: '适合用标题分割为演示页面。',
    themeId: 'gpt',
    recommendedArtifacts: ['slides', 'pdf', 'html'],
    markdown: '# 演示标题\n\n---\n\n## 背景\n\n---\n\n## 方案\n\n---\n\n## 下一步',
  },
  {
    id: 'email-brief',
    name: '邮件正文',
    category: 'work',
    description: '适合复制为富文本邮件。',
    themeId: 'gpt',
    recommendedArtifacts: ['html', 'markdown'],
    markdown: '# 主题\n\n你好，\n\n这里是主要内容。\n\n## 需要你确认\n\n- 事项一\n- 事项二\n\n谢谢。',
  },
  {
    id: 'release-note',
    name: '发布说明',
    category: 'technical',
    description: '适合版本发布和部署说明。',
    themeId: 'github',
    recommendedArtifacts: ['markdown', 'html', 'pdf'],
    markdown: '# Release v0.0.0\n\n## Added\n\n- \n\n## Changed\n\n- \n\n## Fixed\n\n- \n\n## Migration\n\nNo migration required.',
  },
];

export function getTemplateById(id: string): ShareTemplate | undefined {
  return SHARE_TEMPLATES.find((template) => template.id === id);
}

export function getTemplatePresetSettings(template: ShareTemplate): ShareTemplatePresetSettings {
  return {
    ...DEFAULT_TEMPLATE_PRESET_SETTINGS,
    themeId: template.themeId,
  };
}
