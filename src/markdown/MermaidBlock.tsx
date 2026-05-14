import { useEffect, useId, useMemo, useRef, useState } from 'react';

interface MermaidBlockProps {
  chart: string;
}

type MermaidStatus = 'rendering' | 'done' | 'error';

export function MermaidBlock({ chart }: MermaidBlockProps) {
  const reactId = useId();
  const renderId = useMemo(() => `sharkdown-mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [reactId]);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderKey = `${renderId}\u0000${chart}`;
  const [result, setResult] = useState<{
    key: string;
    status: MermaidStatus;
    svg: string;
    error: string;
  } | null>(null);
  const current =
    result?.key === renderKey
      ? result
      : { key: renderKey, status: 'rendering' as const, svg: '', error: '' };

  useEffect(() => {
    let cancelled = false;

    async function renderChart() {
      try {
        const { default: mermaid } = await import('mermaid');
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'neutral',
        });
        const result = await mermaid.render(renderId, chart);
        if (cancelled) {
          return;
        }
        setResult({ key: renderKey, status: 'done', svg: result.svg, error: '' });
        window.requestAnimationFrame(() => {
          if (!cancelled && containerRef.current) {
            result.bindFunctions?.(containerRef.current);
          }
        });
      } catch (err) {
        if (!cancelled) {
          setResult({
            key: renderKey,
            status: 'error',
            svg: '',
            error: err instanceof Error ? err.message : 'Mermaid 图表语法无法渲染。',
          });
        }
      }
    }

    void renderChart();

    return () => {
      cancelled = true;
    };
  }, [chart, renderId, renderKey]);

  return (
    <div className="sharkdown-mermaid" data-mermaid-status={current.status}>
      {current.status === 'rendering' ? (
        <div className="sharkdown-mermaid-placeholder">Rendering</div>
      ) : null}
      {current.status === 'error' ? (
        <pre className="sharkdown-mermaid-error">{current.error}</pre>
      ) : null}
      {current.svg ? <div ref={containerRef} dangerouslySetInnerHTML={{ __html: current.svg }} /> : null}
    </div>
  );
}
