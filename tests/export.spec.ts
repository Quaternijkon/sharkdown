import { expect, test } from '@playwright/test';

test('renders the editor, preview, themes, formulas, diagrams, and export controls', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Sharkdown', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '下载 PNG' })).toBeVisible();
  await expect(page.getByRole('button', { name: '复制图片' })).toBeVisible();

  const preview = page.locator('.markdown-export-frame');
  await expect(preview).toContainText('Sharkdown 示例');
  await expect(preview.locator('table')).toBeVisible();
  await expect(preview.locator('.katex').first()).toBeVisible();
  await expect(preview.locator('.sharkdown-mermaid svg').first()).toBeVisible();

  await page.getByRole('button', { name: '暗色' }).click();
  await expect(page.getByRole('button', { name: '暗色' })).toHaveAttribute('aria-pressed', 'true');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载 PNG' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.png$/);
  await expect(page.getByText('PNG 已生成。')).toBeVisible();
});
