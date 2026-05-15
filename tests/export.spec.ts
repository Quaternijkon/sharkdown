import { expect, test } from '@playwright/test';

test('renders the editor, preview, themes, formulas, diagrams, and export controls', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Sharkdown', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: '转换导出' })).toBeVisible();
  await expect(page.getByRole('tab', { name: '外观样式' })).toBeVisible();
  await expect(page.getByRole('tab', { name: '分析评估' })).toBeVisible();
  await expect(page.getByRole('tab', { name: '文件系统' })).toBeVisible();
  await expect(page.getByRole('separator', { name: '调整编辑器和预览宽度' })).toBeVisible();
  await expect(page.getByRole('separator', { name: '调整预览和右侧栏宽度' })).toBeVisible();
  await expect(page.getByRole('button', { name: '下载 PNG' })).toBeVisible();
  await expect(page.getByRole('button', { name: '复制 PNG 图片' })).toBeVisible();
  await expect(page.getByText('Share Markdown')).toBeVisible();
  await expect(page.getByRole('button', { name: '导出 .sharkdown 工程包' })).toBeVisible();
  await expect(page.getByRole('button', { name: '导出自包含 HTML' })).toBeVisible();

  await page.getByRole('tab', { name: '文件系统' }).click();
  await expect(page.getByText('文档库')).toBeVisible();

  await page.getByRole('tab', { name: '分析评估' }).click();
  await expect(page.getByRole('heading', { name: '文档画像' })).toBeVisible();
  await expect(page.getByText('语法坐标')).toBeVisible();
  await expect(page.getByText('分享可用性')).toBeVisible();

  await page.getByRole('tab', { name: '外观样式' }).click();
  await expect(page.getByText('分享模板')).toBeVisible();

  const preview = page.locator('.markdown-export-frame');
  await expect(preview).toContainText('Sharkdown 示例');
  await expect(preview.locator('table')).toBeVisible();
  await expect(preview.locator('.katex').first()).toBeVisible();
  await expect(preview.locator('.sharkdown-mermaid svg').first()).toBeVisible();

  await page.getByRole('button', { name: '选择主题：GPT 黑白灰' }).click();
  await expect(page.getByRole('button', { name: '选择主题：GPT 黑白灰' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByRole('tab', { name: '转换导出' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载 PNG' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.png$/);
  await expect(page.getByText('PNG 已生成。')).toBeVisible();
});

test('shows conversion targets and recommended formats', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Sharkdown', exact: true })).toBeVisible();
  const convertPanel = page.locator('section').filter({ hasText: '转换目标' });
  await expect(convertPanel.getByText('Convert')).toBeVisible();
  await convertPanel.getByRole('button', { name: /小红书图文/ }).click();
  await expect(convertPanel.getByText('轮播拆分')).toBeVisible();
  await expect(convertPanel.getByRole('button', { name: 'png', exact: true })).toBeVisible();

  await convertPanel.getByRole('button', { name: /微信公众号/ }).click();
  await expect(convertPanel.getByRole('button', { name: 'html-fragment', exact: true })).toBeVisible();
  await expect(convertPanel.getByRole('button', { name: 'rich-text', exact: true })).toBeVisible();
});
