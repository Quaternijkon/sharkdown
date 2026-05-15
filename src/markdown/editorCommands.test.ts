import { describe, expect, it } from 'vitest';

import { applyMarkdownFormat } from './editorCommands';

describe('applyMarkdownFormat', () => {
  it('wraps the selected text with bold markdown', () => {
    expect(applyMarkdownFormat('hello world', 6, 11, 'bold').markdown).toBe('hello **world**');
  });

  it('turns selected lines into a task list', () => {
    expect(applyMarkdownFormat('first\nsecond', 0, 12, 'task-list').markdown).toBe('- [ ] first\n- [ ] second');
  });

  it('inserts a link placeholder when no text is selected', () => {
    const result = applyMarkdownFormat('hello ', 6, 6, 'link');

    expect(result.markdown).toBe('hello [链接文字](https://example.com)');
    expect(result.selectionStart).toBeGreaterThan(6);
  });
});
