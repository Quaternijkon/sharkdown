import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { DocumentState } from '../types';

export const DEFAULT_MARKDOWN = `# Sharkdown 示例

这是一段 **中文、English 和 Emoji 🦈** 混排内容，适合直接导出为图片。

## 常见 AI 输出

- [x] 标题、列表、引用和任务清单
- [x] 表格、代码块和链接
- [x] 数学公式与 Mermaid 图表

> 用户内容只在当前浏览器里处理。

| 模块 | 技术 | 状态 |
|---|---|---:|
| Markdown | react-markdown | ready |
| Formula | KaTeX | ready |
| Diagram | Mermaid | ready |
| Export | html-to-image | ready |

\`\`\`ts
type ExportFormat = 'png' | 'jpeg' | 'svg';

export function render(markdown: string) {
  return markdown.trim();
}
\`\`\`

行内公式 $E = mc^2$，块级公式：

$$
\\int_0^1 x^2 dx = \\frac{1}{3}
$$

\`\`\`mermaid
flowchart LR
  A[Markdown] --> B[Preview]
  B --> C[PNG/JPEG/SVG]
\`\`\`
`;

export const DEFAULT_DOCUMENT_STATE: DocumentState = {
  markdown: DEFAULT_MARKDOWN,
  themeId: 'github',
  width: 720,
  padding: 48,
  radius: 18,
  fontScale: 1,
  pixelRatio: 2,
  background: '#ffffff',
  allowRawHtml: false,
};

interface EditorStore extends DocumentState {
  setMarkdown: (markdown: string) => void;
  updateSettings: (settings: Partial<Omit<DocumentState, 'markdown'>>) => void;
  resetDocument: () => void;
  clearMarkdown: () => void;
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set) => ({
      ...DEFAULT_DOCUMENT_STATE,
      setMarkdown: (markdown) => set({ markdown }),
      updateSettings: (settings) => set(settings),
      resetDocument: () => set(DEFAULT_DOCUMENT_STATE),
      clearMarkdown: () => set({ markdown: '' }),
    }),
    {
      name: 'sharkdown-document-state',
      partialize: (state) => ({
        markdown: state.markdown,
        themeId: state.themeId,
        width: state.width,
        padding: state.padding,
        radius: state.radius,
        fontScale: state.fontScale,
        pixelRatio: state.pixelRatio,
        background: state.background,
        allowRawHtml: state.allowRawHtml,
      }),
    },
  ),
);
