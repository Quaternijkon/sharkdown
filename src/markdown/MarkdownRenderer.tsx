import ReactMarkdown, { defaultUrlTransform, type Components } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { useEffect, useState } from 'react';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { PluggableList } from 'unified';

import { CodeBlock } from './CodeBlock';
import { MermaidBlock } from './MermaidBlock';
import { sanitizeSchema } from './sanitizeSchema';
import {
  getLocalImageAsset,
  LOCAL_IMAGE_PROTOCOL,
  parseLocalImageReference,
  readBlobAsDataUrl,
} from '../utils/localImages';

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
    const localReference = parseLocalImageReference(src);
    if (localReference) {
      return <LocalImage alt={alt ?? ''} reference={localReference} />;
    }

    return <img alt={alt ?? ''} src={src} crossOrigin="anonymous" loading="eager" {...props} />;
  },
};

export function MarkdownRenderer({ markdown, allowRawHtml }: MarkdownRendererProps) {
  const rehypePlugins = (allowRawHtml
    ? [rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeKatex]
    : [rehypeKatex]) as PluggableList;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={rehypePlugins}
      components={components}
      urlTransform={urlTransform}
    >
      {markdown}
    </ReactMarkdown>
  );
}

function urlTransform(url: string, key: string): string | null | undefined {
  if (key === 'src' && url.startsWith(LOCAL_IMAGE_PROTOCOL)) {
    return url;
  }
  return defaultUrlTransform(url);
}

interface LocalImageProps {
  alt: string;
  reference: {
    id: string;
    fileName: string;
  };
}

function LocalImage({ alt, reference }: LocalImageProps) {
  const [resolved, setResolved] = useState<{
    id: string;
    src: string | null;
    missing: boolean;
  }>({
    id: reference.id,
    src: null,
    missing: false,
  });

  useEffect(() => {
    let cancelled = false;

    void getLocalImageAsset(reference.id)
      .then(async (asset) => {
        if (cancelled) {
          return;
        }
        if (!asset) {
          setResolved({ id: reference.id, src: null, missing: true });
          return;
        }
        const src = await readBlobAsDataUrl(asset.blob);
        if (!cancelled) {
          setResolved({ id: reference.id, src, missing: false });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolved({ id: reference.id, src: null, missing: true });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reference.id]);

  const src = resolved.id === reference.id ? resolved.src : null;
  const missing = resolved.id === reference.id && resolved.missing;

  if (missing) {
    return (
      <span className="sharkdown-local-image-missing">
        本地图片未找到：{reference.fileName}
      </span>
    );
  }

  if (!src) {
    return <span className="sharkdown-local-image-loading">本地图片加载中：{reference.fileName}</span>;
  }

  return <img alt={alt} src={src} loading="eager" data-local-image-id={reference.id} />;
}
