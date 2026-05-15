export type MarkdownFeatureId =
  | 'heading'
  | 'paragraph'
  | 'unorderedList'
  | 'orderedList'
  | 'taskList'
  | 'blockquote'
  | 'table'
  | 'codeBlock'
  | 'inlineCode'
  | 'link'
  | 'image'
  | 'formula'
  | 'mermaid'
  | 'html';

export interface MarkdownFeatureInsight {
  id: MarkdownFeatureId;
  label: string;
  present: boolean;
  purpose: string;
}

export interface SectionDistribution {
  title: string;
  level: number;
  lineStart: number;
  lineEnd: number;
  weight: number;
  dominantContent: 'text' | 'task' | 'code' | 'table' | 'mixed';
}

export interface MarkdownAnalysisReport {
  insights: {
    documentType: string;
    mainTakeaway: string;
    markdownFeatures: MarkdownFeatureInsight[];
    programmingLanguages: Array<{ language: string; count: number }>;
  };
  statistics: {
    sectionDistribution: SectionDistribution[];
    contentTypeDistribution: Record<string, number>;
    taskProgress: null | {
      total: number;
      completed: number;
      completionRate: number;
    };
    codeAnalysis: null | {
      totalBlocks: number;
      languages: Array<{ language: string; count: number }>;
    };
  };
  evaluation: {
    scaleLevel: 'tiny' | 'small' | 'medium' | 'large';
    complexityLevel: 'low' | 'medium' | 'high';
    scores: {
      structureClarity: number;
      contentCompleteness: number;
      visualizationPotential: number;
    };
    summary: string;
  };
  chartRecommendations: Array<{
    chartType: 'syntax-map' | 'bar' | 'progress-ring' | 'donut' | 'scorecard';
    title: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

interface CodeBlock {
  language: string;
  lineStart: number;
  lineEnd: number;
  body: string[];
}

interface FeatureFlags {
  heading: boolean;
  paragraph: boolean;
  unorderedList: boolean;
  orderedList: boolean;
  taskList: boolean;
  blockquote: boolean;
  table: boolean;
  codeBlock: boolean;
  inlineCode: boolean;
  link: boolean;
  image: boolean;
  formula: boolean;
  mermaid: boolean;
  html: boolean;
}

export function analyzeMarkdown(markdown: string): MarkdownAnalysisReport {
  const lines = markdown.split(/\r?\n/);
  const codeBlocks = collectCodeBlocks(lines);
  const flags = collectFeatureFlags(lines, codeBlocks);
  const sectionDistribution = collectSectionDistribution(lines, codeBlocks);
  const taskProgress = collectTaskProgress(lines);
  const languages = collectLanguages(codeBlocks);
  const contentTypeDistribution = collectContentTypeDistribution(lines, codeBlocks);
  const headingCount = lines.filter((line) => /^#{1,6}\s+/.test(line)).length;
  const structuralSignals = Number(flags.heading) + Number(flags.table) + Number(flags.taskList) + Number(flags.codeBlock);
  const complexityScore = structuralSignals + codeBlocks.length + (flags.mermaid ? 2 : 0) + (flags.formula ? 1 : 0);

  return {
    insights: {
      documentType: inferDocumentType(markdown, flags),
      mainTakeaway: inferMainTakeaway(lines),
      markdownFeatures: buildFeatureInsights(flags),
      programmingLanguages: languages,
    },
    statistics: {
      sectionDistribution,
      contentTypeDistribution,
      taskProgress,
      codeAnalysis: codeBlocks.length ? { totalBlocks: codeBlocks.length, languages } : null,
    },
    evaluation: {
      scaleLevel: inferScale(lines),
      complexityLevel: complexityScore >= 7 ? 'high' : complexityScore >= 3 ? 'medium' : 'low',
      scores: {
        structureClarity: scoreStructureClarity(headingCount, sectionDistribution),
        contentCompleteness: scoreContentCompleteness(flags, headingCount),
        visualizationPotential: scoreVisualizationPotential(flags, taskProgress, codeBlocks),
      },
      summary: buildSummary(flags, taskProgress, codeBlocks),
    },
    chartRecommendations: buildChartRecommendations(flags, taskProgress, codeBlocks),
  };
}

function collectFeatureFlags(lines: string[], codeBlocks: CodeBlock[]): FeatureFlags {
  const body = lines.join('\n');
  return {
    heading: lines.some((line) => /^#{1,6}\s+/.test(line)),
    paragraph: lines.some((line) => line.trim() && !/^(#{1,6}\s+|[-*+]\s+|\d+\.\s+|>\s+|\|)/.test(line.trim())),
    unorderedList: lines.some((line) => /^\s*[-*+]\s+/.test(line)),
    orderedList: lines.some((line) => /^\s*\d+\.\s+/.test(line)),
    taskList: lines.some((line) => /^\s*[-*+]\s+\[[ xX]\]\s+/.test(line)),
    blockquote: lines.some((line) => /^\s*>\s+/.test(line)),
    table: lines.some((line, index) => line.includes('|') && /^\s*\|?\s*:?-{3,}:?\s*\|/.test(lines[index + 1] ?? '')),
    codeBlock: codeBlocks.length > 0,
    inlineCode: /`[^`\n]+`/.test(body),
    link: /\[[^\]]+\]\((?!local-image:\/\/)[^)]+\)/.test(body),
    image: /!\[[^\]]*]\([^)]+\)/.test(body),
    formula: /\$\$[\s\S]+?\$\$|\$[^$\n]+\$/.test(body),
    mermaid: codeBlocks.some((block) => block.language.toLowerCase() === 'mermaid'),
    html: /<\/?[a-z][\s\S]*>/i.test(body),
  };
}

function collectCodeBlocks(lines: string[]): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  let current: CodeBlock | null = null;
  lines.forEach((line, index) => {
    const fence = /^```(\S*)/.exec(line.trim());
    if (fence && !current) {
      current = {
        language: fence[1] || 'plain',
        lineStart: index + 1,
        lineEnd: index + 1,
        body: [],
      };
      return;
    }
    if (line.trim() === '```' && current) {
      current.lineEnd = index + 1;
      blocks.push(current);
      current = null;
      return;
    }
    current?.body.push(line);
  });
  return blocks;
}

function collectLanguages(codeBlocks: CodeBlock[]): Array<{ language: string; count: number }> {
  const counts = new Map<string, number>();
  codeBlocks.forEach((block) => counts.set(block.language, (counts.get(block.language) ?? 0) + 1));
  return Array.from(counts, ([language, count]) => ({ language, count })).sort((a, b) => b.count - a.count);
}

function collectSectionDistribution(lines: string[], codeBlocks: CodeBlock[]): SectionDistribution[] {
  const headings = lines
    .map((line, index) => {
      const match = /^(#{1,6})\s+(.+)$/.exec(line);
      return match ? { title: match[2].trim(), level: match[1].length, lineStart: index + 1 } : null;
    })
    .filter((heading): heading is { title: string; level: number; lineStart: number } => heading !== null);

  if (!headings.length) {
    const weight = meaningfulLineCount(lines, 1, lines.length);
    return weight
      ? [{ title: '正文', level: 1, lineStart: 1, lineEnd: lines.length, weight: 1, dominantContent: 'text' }]
      : [];
  }

  const total = Math.max(1, meaningfulLineCount(lines, 1, lines.length));
  return headings.map((heading, index) => {
    const lineEnd = (headings[index + 1]?.lineStart ?? lines.length + 1) - 1;
    const count = meaningfulLineCount(lines, heading.lineStart, lineEnd);
    return {
      title: heading.title,
      level: heading.level,
      lineStart: heading.lineStart,
      lineEnd,
      weight: Number((count / total).toFixed(3)),
      dominantContent: dominantContentType(lines, heading.lineStart, lineEnd, codeBlocks),
    };
  });
}

function meaningfulLineCount(lines: string[], lineStart: number, lineEnd: number): number {
  return lines
    .slice(lineStart - 1, lineEnd)
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed && trimmed !== '---' && !/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(trimmed);
    }).length;
}

function dominantContentType(
  lines: string[],
  lineStart: number,
  lineEnd: number,
  codeBlocks: CodeBlock[],
): SectionDistribution['dominantContent'] {
  const sectionLines = lines.slice(lineStart - 1, lineEnd);
  const taskLines = sectionLines.filter((line) => /^\s*[-*+]\s+\[[ xX]\]\s+/.test(line)).length;
  const tableLines = sectionLines.filter((line) => line.includes('|')).length;
  const codeLines = codeBlocks
    .filter((block) => block.lineStart >= lineStart && block.lineEnd <= lineEnd)
    .reduce((sum, block) => sum + block.body.length, 0);
  const values: Array<[Exclude<SectionDistribution['dominantContent'], 'text' | 'mixed'>, number]> = [
    ['task', taskLines],
    ['table', tableLines],
    ['code', codeLines],
  ];
  const dominant = values.sort((a, b) => b[1] - a[1])[0];
  if (!dominant || dominant[1] === 0) {
    return 'text';
  }
  return dominant[1] >= sectionLines.length / 2 ? dominant[0] : 'mixed';
}

function collectTaskProgress(lines: string[]): MarkdownAnalysisReport['statistics']['taskProgress'] {
  const taskLines = lines.filter((line) => /^\s*[-*+]\s+\[[ xX]\]\s+/.test(line));
  if (!taskLines.length) {
    return null;
  }
  const completed = taskLines.filter((line) => /^\s*[-*+]\s+\[[xX]\]\s+/.test(line)).length;
  return {
    total: taskLines.length,
    completed,
    completionRate: Number((completed / taskLines.length).toFixed(3)),
  };
}

function collectContentTypeDistribution(lines: string[], codeBlocks: CodeBlock[]): Record<string, number> {
  const total = Math.max(1, meaningfulLineCount(lines, 1, lines.length));
  const counts = {
    explanatory: lines.filter((line) => line.trim() && !/^(#{1,6}\s+|[-*+]\s+|\d+\.\s+|>\s+|\|)/.test(line.trim())).length,
    structured: lines.filter((line) => /^(\s*[-*+]\s+|\s*\d+\.\s+|\|)/.test(line)).length,
    technical: codeBlocks.reduce((sum, block) => sum + block.body.length + 2, 0),
    visual: lines.filter((line) => /!\[[^\]]*]\([^)]+\)|```mermaid|\$\$/.test(line)).length,
  };
  return Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, Number((value / total).toFixed(3))]));
}

function buildFeatureInsights(flags: FeatureFlags): MarkdownFeatureInsight[] {
  const labels: Record<MarkdownFeatureId, [string, string]> = {
    heading: ['标题', '组织章节和阅读路径'],
    paragraph: ['正文', '承载解释性内容'],
    unorderedList: ['无序列表', '表达枚举、要点或拆解'],
    orderedList: ['有序列表', '表达步骤或顺序'],
    taskList: ['任务清单', '表达进度和待办'],
    blockquote: ['引用', '强调提示或外部观点'],
    table: ['表格', '承载结构化对比或状态'],
    codeBlock: ['代码块', '展示代码、配置或命令'],
    inlineCode: ['行内代码', '标记命令、变量或术语'],
    link: ['链接', '连接外部或内部引用'],
    image: ['图片', '提供视觉素材'],
    formula: ['公式', '表达计算、约束或推导'],
    mermaid: ['Mermaid', '表达流程、关系或图表'],
    html: ['HTML', '扩展 Markdown 渲染能力'],
  };
  return (Object.keys(labels) as MarkdownFeatureId[]).map((id) => ({
    id,
    label: labels[id][0],
    present: flags[id],
    purpose: flags[id] ? labels[id][1] : '未使用',
  }));
}

function inferDocumentType(markdown: string, flags: FeatureFlags): string {
  const lower = markdown.toLowerCase();
  if (lower.includes('api') || lower.includes('install') || flags.codeBlock) {
    return 'technical_doc';
  }
  if (flags.taskList || lower.includes('计划') || lower.includes('todo')) {
    return 'project_plan';
  }
  if (lower.includes('changelog') || lower.includes('release')) {
    return 'changelog';
  }
  return flags.heading ? 'article' : 'note';
}

function inferMainTakeaway(lines: string[]): string {
  const heading = lines.find((line) => /^#\s+/.test(line))?.replace(/^#\s+/, '').trim();
  return heading ? `文档围绕“${heading}”展开。` : '文档没有明确一级标题，主题需要从正文判断。';
}

function inferScale(lines: string[]): MarkdownAnalysisReport['evaluation']['scaleLevel'] {
  const meaningful = meaningfulLineCount(lines, 1, lines.length);
  if (meaningful < 12) return 'tiny';
  if (meaningful < 40) return 'small';
  if (meaningful < 120) return 'medium';
  return 'large';
}

function scoreStructureClarity(headingCount: number, sections: SectionDistribution[]): number {
  if (!headingCount) return 42;
  const emptyPenalty = sections.filter((section) => section.weight < 0.02).length * 8;
  return clampScore(72 + Math.min(18, headingCount * 2) - emptyPenalty);
}

function scoreContentCompleteness(flags: FeatureFlags, headingCount: number): number {
  return clampScore(
    46 +
      Number(flags.heading) * 16 +
      Number(flags.paragraph) * 10 +
      Number(flags.unorderedList || flags.orderedList || flags.taskList) * 8 +
      Math.min(20, headingCount * 2),
  );
}

function scoreVisualizationPotential(
  flags: FeatureFlags,
  taskProgress: MarkdownAnalysisReport['statistics']['taskProgress'],
  codeBlocks: CodeBlock[],
): number {
  return clampScore(
    35 +
      Number(flags.heading) * 12 +
      Number(flags.table) * 14 +
      Number(Boolean(taskProgress)) * 16 +
      Number(flags.mermaid) * 12 +
      Math.min(14, codeBlocks.length * 4),
  );
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildSummary(
  flags: FeatureFlags,
  taskProgress: MarkdownAnalysisReport['statistics']['taskProgress'],
  codeBlocks: CodeBlock[],
): string {
  const parts = ['文档'];
  if (flags.heading) parts.push('结构清晰');
  if (flags.taskList && taskProgress) parts.push(`任务完成度 ${Math.round(taskProgress.completionRate * 100)}%`);
  if (codeBlocks.length) parts.push(`包含 ${codeBlocks.length} 个代码块`);
  if (flags.table) parts.push('包含结构化表格');
  return `${parts.join('，')}。`;
}

function buildChartRecommendations(
  flags: FeatureFlags,
  taskProgress: MarkdownAnalysisReport['statistics']['taskProgress'],
  codeBlocks: CodeBlock[],
): MarkdownAnalysisReport['chartRecommendations'] {
  const charts: MarkdownAnalysisReport['chartRecommendations'] = [
    { chartType: 'syntax-map', title: 'Markdown 语法能力图', priority: 'high' },
    { chartType: 'bar', title: '章节内容占比', priority: 'high' },
    { chartType: 'donut', title: '内容类型分布', priority: 'medium' },
    { chartType: 'scorecard', title: '总体质量评分', priority: 'medium' },
  ];
  if (taskProgress) {
    charts.push({ chartType: 'progress-ring', title: '任务完成度', priority: 'high' });
  }
  if (codeBlocks.length) {
    charts.push({ chartType: 'bar', title: '代码语言分布', priority: 'medium' });
  }
  if (flags.table) {
    charts.push({ chartType: 'bar', title: '表格结构概览', priority: 'low' });
  }
  return charts;
}
