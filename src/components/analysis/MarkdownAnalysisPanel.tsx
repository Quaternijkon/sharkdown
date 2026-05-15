import { BarChart3, CircleCheck, Gauge, Map } from 'lucide-react';
import { useMemo } from 'react';

import { analyzeMarkdown } from '../../analysis/markdownAnalysis';

interface MarkdownAnalysisPanelProps {
  markdown: string;
}

export function MarkdownAnalysisPanel({ markdown }: MarkdownAnalysisPanelProps) {
  const report = useMemo(() => analyzeMarkdown(markdown), [markdown]);
  const taskProgress = report.statistics.taskProgress;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <BarChart3 size={17} />
          <span>Markdown 分析</span>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
          {report.evaluation.complexityLevel}
        </span>
      </div>

      <div className="space-y-4">
        <section>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Map size={14} />
            <span>语法能力图</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {report.insights.markdownFeatures.map((feature) => (
              <div
                key={feature.id}
                title={feature.purpose}
                className={`rounded-md border px-2 py-1.5 text-center text-[11px] ${
                  feature.present
                    ? 'border-teal-600 bg-teal-50 font-medium text-teal-900'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                {feature.label}
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">主要洞见</div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs leading-5 text-slate-600">
            <div>类型：{report.insights.documentType}</div>
            <div>{report.insights.mainTakeaway}</div>
            <div>{report.evaluation.summary}</div>
          </div>
        </section>

        {report.insights.programmingLanguages.length ? (
          <section>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">代码语言</div>
            <div className="flex flex-wrap gap-1.5">
              {report.insights.programmingLanguages.map((item) => (
                <span key={item.language} className="rounded-md bg-slate-900 px-2 py-1 text-[11px] text-white">
                  {item.language} · {item.count}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {taskProgress ? (
          <section className="rounded-md border border-slate-200 p-2">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 font-semibold">
                <CircleCheck size={14} />
                任务完成度
              </span>
              <span>{Math.round(taskProgress.completionRate * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-600"
                style={{ width: `${Math.round(taskProgress.completionRate * 100)}%` }}
              />
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {taskProgress.completed}/{taskProgress.total} 已完成
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">章节占比</div>
          <div className="space-y-1.5">
            {report.statistics.sectionDistribution.slice(0, 5).map((section) => (
              <div key={`${section.title}-${section.lineStart}`}>
                <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="truncate">{section.title}</span>
                  <span>{Math.round(section.weight * 100)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-slate-500" style={{ width: `${section.weight * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Gauge size={14} />
            <span>总体评估</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Score label="结构" value={report.evaluation.scores.structureClarity} />
            <Score label="完整" value={report.evaluation.scores.contentCompleteness} />
            <Score label="可视" value={report.evaluation.scores.visualizationPotential} />
          </div>
        </section>
      </div>
    </section>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-center">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
