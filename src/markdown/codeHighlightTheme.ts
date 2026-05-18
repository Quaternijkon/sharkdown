export function getCodeHighlightTheme(themeId: string): 'github-light' | 'github-dark' {
  return ['douyin', 'black-gold'].includes(themeId) ? 'github-dark' : 'github-light';
}
