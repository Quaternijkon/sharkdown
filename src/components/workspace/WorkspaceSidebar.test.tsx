import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { WorkspaceSidebar } from './WorkspaceSidebar';

describe('WorkspaceSidebar', () => {
  it('switches between independent workspace panels and can collapse the panel body', () => {
    render(
      <WorkspaceSidebar
        panels={[
          { id: 'convert', label: '转换导出', content: <div>Convert Panel</div> },
          { id: 'style', label: '外观样式', content: <div>Style Panel</div> },
          { id: 'analysis', label: '分析评估', content: <div>Analysis Panel</div> },
          { id: 'library', label: '文件系统', content: <div>Library Panel</div> },
        ]}
      />,
    );

    expect(screen.getByRole('tabpanel', { name: '转换导出' })).toHaveTextContent('Convert Panel');

    fireEvent.click(screen.getByRole('tab', { name: '分析评估' }));

    expect(screen.getByRole('tabpanel', { name: '分析评估' })).toHaveTextContent('Analysis Panel');
    expect(screen.queryByText('Convert Panel')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '折叠右侧栏' }));

    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '文件系统' })).toBeInTheDocument();
  });
});
