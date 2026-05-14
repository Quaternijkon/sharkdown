import { expect, test } from '@playwright/test';

test('renders the editor, preview, themes, formulas, diagrams, and export controls', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Sharkdown', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '下载 PNG' })).toBeVisible();
  await expect(page.getByRole('button', { name: '复制 PNG 图片' })).toBeVisible();
  await expect(page.getByText('文档库')).toBeVisible();
  await expect(page.getByText('Share Markdown')).toBeVisible();
  await expect(page.getByText('分享模板')).toBeVisible();
  await expect(page.getByRole('button', { name: '导出 .sharkdown 工程包' })).toBeVisible();
  await expect(page.getByRole('button', { name: '导出自包含 HTML' })).toBeVisible();

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

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载 PNG' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.png$/);
  await expect(page.getByText('PNG 已生成。')).toBeVisible();
});
