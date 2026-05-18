import { useEffect, useMemo, useState } from 'react';

import { getCodeHighlightTheme } from './codeHighlightTheme';
import { useEditorStore } from '../store/useEditorStore';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const supportedLanguageAliases: Record<string, string> = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  py: 'python',
  shell: 'bash',
  sh: 'bash',
  zsh: 'bash',
  ps: 'powershell',
  ps1: 'powershell',
  text: 'text',
  txt: 'text',
};

export function CodeBlock({ code, language = 'text' }: CodeBlockProps) {
  const themeId = useEditorStore((state) => state.themeId);
  const [highlighted, setHighlighted] = useState<{ key: string; html: string } | null>(null);
  const normalizedLanguage = useMemo(() => normalizeLanguage(language), [language]);
  const highlightTheme = getCodeHighlightTheme(themeId);
  const highlightKey = `${highlightTheme}\u0000${normalizedLanguage}\u0000${code}`;
  const highlightedHtml = highlighted?.key === highlightKey ? highlighted.html : '';

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      try {
        const { codeToHtml } = await import('shiki');
        const html = await codeToHtml(code, {
          lang: normalizedLanguage,
          theme: highlightTheme,
        });
        if (!cancelled) {
          setHighlighted({ key: highlightKey, html });
        }
      } catch {
        if (!cancelled) {
          setHighlighted({ key: highlightKey, html: '' });
        }
      }
    }

    void highlight();

    return () => {
      cancelled = true;
    };
  }, [code, normalizedLanguage, highlightKey, highlightTheme]);

  return (
    <figure className="sharkdown-code-block">
      <figcaption>{normalizedLanguage}</figcaption>
      {highlightedHtml ? (
        <div
          className="sharkdown-code-html"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre>
          <code>{code}</code>
        </pre>
      )}
    </figure>
  );
}

function normalizeLanguage(language: string): string {
  const cleanLanguage = language.toLowerCase().trim();
  return supportedLanguageAliases[cleanLanguage] ?? cleanLanguage ?? 'text';
}
