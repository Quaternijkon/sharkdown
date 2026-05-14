import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { PluggableList } from 'unified';

import { CodeBlock } from './CodeBlock';
import { MermaidBlock } from './MermaidBlock';
import { sanitizeSchema } from './sanitizeSchema';

interface MarkdownRendererProps {
  markdown: string;
  allowRawHtml: boolean;
}

const components: Components = {
  a({ children, ...props }) {
    return (
      <a {...props} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  },
  code({ className, children, ...props }) {
    const code = String(children ?? '').replace(/\n$/, '');
    const language = /language-(\S+)/.exec(className ?? '')?.[1];

    if (!language) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }

    if (language.toLowerCase() === 'mermaid') {
      return <MermaidBlock chart={code} />;
    }

    return <CodeBlock code={code} language={language} />;
  },
  img({ alt, src, ...props }) {
    return <img alt={alt ?? ''} src={src} crossOrigin="anonymous" loading="eager" {...props} />;
  },
};

export function MarkdownRenderer({ markdown, allowRawHtml }: MarkdownRendererProps) {
  const rehypePlugins = (allowRawHtml
    ? [rehypeRaw, rehypeKatex, [rehypeSanitize, sanitizeSchema]]
    : [rehypeKatex, [rehypeSanitize, sanitizeSchema]]) as PluggableList;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={rehypePlugins}
      components={components}
    >
      {markdown}
    </ReactMarkdown>
  );
}
