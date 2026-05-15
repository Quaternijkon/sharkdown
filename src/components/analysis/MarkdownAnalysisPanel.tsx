import { BarChart3, CheckCircle2, FileCode2, Gauge, Layers3, Map, Sparkles, Timer } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';

import { analyzeMarkdown, type MarkdownFeatureId, type MarkdownFeatureInsight } from '../../analysis/markdownAnalysis';

interface MarkdownAnalysisPanelProps {
  markdown: string;
}

const featureCoordinates: Record<MarkdownFeatureId, { x: number; y: number }> = {
  heading: { x: 14, y: 18 },
  paragraph: { x: 28, y: 34 },
  unorderedList: { x: 26, y: 58 },
  orderedList: { x: 39, y: 66 },
  taskList: { x: 47, y: 78 },
  blockquote: { x: 18, y: 75 },
  table: { x: 58, y: 50 },
  codeBlock: { x: 74, y: 56 },
  inlineCode: { x: 68, y: 38 },
  link: { x: 48, y: 30 },
  image: { x: 60, y: 18 },
  formula: { x: 82, y: 24 },
  mermaid: { x: 86, y: 72 },
  html: { x: 72, y: 84 },
};

const contentTypeLabels: Record<string, string> = {
  explanatory: '解释',
  structured: '结构',
  technical: '技术',
  visual: '视觉',
};

const contentTypeColors: Record<string, string> = {
  explanatory: '#0f766e',
  structured: '#2563eb',
  technical: '#7c3aed',
  visual: '#ea580c',
};

export function MarkdownAnalysisPanel({ markdown }: MarkdownAnalysisPanelProps) {
  const report = useMemo(() => analyzeMarkdown(markdown), [markdown]);
  const taskProgress = report.statistics.taskProgress;
  const basic = report.statistics.basic;
  const syntaxCoveragePercent = Math.round(report.statistics.syntaxCoverage.rate * 100);

  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Sparkles size={17} />
              <h2>文档画像</h2>
            </div>
            <p className="text-sm leading-6 text-slate-600">{report.evaluation.summary}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
              {report.insights.documentTypeLabel}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">{report.evaluation.complexityLevel} complexity</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Metric label="字数" value={basic.wordCount.toLocaleString('zh-CN')} sub={`${basic.lineCount} 行`} />
          <Metric
            icon={<Timer size={15} />}
            label="阅读时长"
            value={`${basic.readingTimeMinutes} min`}
            sub={`${basic.nonEmptyLineCount} 行有效内容`}
          />
          <Metric
            icon={<Map size={15} />}
            label="语法覆盖"
            value={`${syntaxCoveragePercent}%`}
            sub={`${report.statistics.syntaxCoverage.present}/${report.statistics.syntaxCoverage.total} 项`}
          />
          <Metric
            icon={<FileCode2 size={15} />}
            label="代码块"
            value={String(basic.codeBlockCount)}
            sub={report.statistics.codeAnalysis ? `${report.statistics.codeAnalysis.languages.length} 种语言` : '无代码'}
          />
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Gauge size={17} />
            <h3>总体评估</h3>
          </div>
          <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800">
            {report.evaluation.scaleLevel}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ScoreGauge label="结构清晰" value={report.evaluation.scores.structureClarity} color="#0f766e" />
          <ScoreGauge label="内容完整" value={report.evaluation.scores.contentCompleteness} color="#2563eb" />
          <ScoreGauge label="可视化潜力" value={report.evaluation.scores.visualizationPotential} color="#7c3aed" />
          <ScoreGauge label="分享可用性" value={report.evaluation.scores.shareReadiness} color="#ea580c" />
          <ScoreGauge label="阅读友好" value={report.evaluation.scores.readability} color="#0891b2" wide />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Map size={17} />
          <h3>语法坐标</h3>
        </div>
        <FeatureCoordinateMap features={report.insights.markdownFeatures} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Layers3 size={17} />
          <h3>内容构成</h3>
        </div>
        <StackedDistribution values={report.statistics.contentTypeDistribution} />
        <div className="mt-4 grid grid-cols-3 gap-2">
          <SmallStat label="标题" value={String(basic.headingCount)} />
          <SmallStat label="列表" value={String(basic.listItemCount)} />
          <SmallStat label="表格" value={String(basic.tableCount)} />
          <SmallStat label="图片" value={String(basic.imageCount)} />
          <SmallStat label="链接" value={String(basic.linkCount)} />
          <SmallStat label="公式" value={String(basic.formulaCount)} />
        </div>
      </section>

      {taskProgress ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <CheckCircle2 size={17} />
              <h3>任务完成度</h3>
            </div>
            <span className="text-sm font-semibold text-slate-900">{Math.round(taskProgress.completionRate * 100)}%</span>
          </div>
          <div className="grid grid-cols-[82px_minmax(0,1fr)] items-center gap-4">
            <div
              className="grid h-20 w-20 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#0f766e ${Math.round(taskProgress.completionRate * 100)}%, #e2e8f0 0)`,
              }}
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-sm font-semibold text-slate-900">
                {taskProgress.completed}/{taskProgress.total}
              </div>
            </div>
            <div className="space-y-2">
              <ProgressBar label="已完成" value={taskProgress.completionRate} color="#0f766e" />
              <ProgressBar label="未完成" value={1 - taskProgress.completionRate} color="#94a3b8" />
            </div>
          </div>
        </section>
      ) : null}

      {report.insights.programmingLanguages.length ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <BarChart3 size={17} />
            <h3>代码语言</h3>
          </div>
          <div className="space-y-2">
            {report.insights.programmingLanguages.map((item) => (
              <ProgressBar key={item.language} label={item.language} value={item.count / basic.codeBlockCount} color="#111827" />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 text-sm font-semibold text-slate-800">章节占比</div>
        <div className="space-y-3">
          {report.statistics.sectionDistribution.slice(0, 8).map((section) => (
            <div key={`${section.title}-${section.lineStart}`}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-600">
                <span className="min-w-0 truncate">
                  {'#'.repeat(section.level)} {section.title}
                </span>
                <span className="shrink-0">{Math.round(section.weight * 100)}%</span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-slate-700" style={{ width: `${Math.round(section.weight * 100)}%` }} />
                </div>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                  {contentTypeText(section.dominantContent)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 text-sm font-semibold text-slate-800">洞见与建议</div>
        <div className="space-y-3">
          <InsightList title="主要洞见" items={report.insights.strengths} tone="success" />
          <InsightList title="改进建议" items={report.insights.recommendations} tone="warning" />
        </div>
      </section>
    </section>
  );
}

function Metric({ icon, label, value, sub }: { icon?: ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 truncate text-[11px] text-slate-500">{sub}</div>
    </div>
  );
}

function ScoreGauge({ label, value, color, wide = false }: { label: string; value: number; color: string; wide?: boolean }) {
  return (
    <div className={`rounded-md border border-slate-200 bg-slate-50 p-3 ${wide ? 'col-span-2' : ''}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="font-mono text-xs font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function FeatureCoordinateMap({ features }: { features: MarkdownFeatureInsight[] }) {
  return (
    <div className="relative h-72 overflow-hidden rounded-lg border border-slate-200 bg-[linear-gradient(#e2e8f0_1px,transparent_1px),linear-gradient(90deg,#e2e8f0_1px,transparent_1px)] bg-[length:33.33%_33.33%] p-3">
      <div className="absolute left-3 top-2 text-[11px] font-medium text-slate-500">结构组织</div>
      <div className="absolute bottom-2 right-3 text-[11px] font-medium text-slate-500">增强表达</div>
      <div className="absolute bottom-2 left-3 text-[11px] text-slate-400">基础文本</div>
      {features.map((feature) => {
        const point = featureCoordinates[feature.id];
        return (
          <div
            key={feature.id}
            title={feature.purpose}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-1 text-[11px] shadow-sm ${
              feature.present
                ? 'border-teal-600 bg-teal-600 font-medium text-white'
                : 'border-slate-200 bg-white text-slate-400'
            }`}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          >
            {feature.label}
          </div>
        );
      })}
    </div>
  );
}

function StackedDistribution({ values }: { values: Record<string, number> }) {
  const entries = Object.entries(values).filter(([, value]) => value > 0);
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        {entries.map(([key, value]) => (
          <div
            key={key}
            title={`${contentTypeLabels[key] ?? key}: ${Math.round(value * 100)}%`}
            style={{ width: `${Math.max(4, Math.round(value * 100))}%`, backgroundColor: contentTypeColors[key] ?? '#64748b' }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-2 text-xs text-slate-600">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: contentTypeColors[key] ?? '#64748b' }} />
              <span className="truncate">{contentTypeLabels[key] ?? key}</span>
            </span>
            <span className="font-mono text-slate-500">{Math.round(value * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-2 py-2 text-center">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-600">
        <span className="truncate">{label}</span>
        <span className="font-mono">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${Math.round(value * 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function InsightList({ title, items, tone }: { title: string; items: string[]; tone: 'success' | 'warning' }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold text-slate-600">{title}</div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className={`rounded-md border px-3 py-2 text-xs leading-5 ${
              tone === 'success'
                ? 'border-teal-100 bg-teal-50 text-teal-900'
                : 'border-amber-100 bg-amber-50 text-amber-900'
            }`}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function contentTypeText(type: string): string {
  return (
    {
      text: '文本',
      task: '任务',
      code: '代码',
      table: '表格',
      mixed: '混合',
    }[type] ?? type
  );
}
