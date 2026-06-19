import { describe, it, expect, vi } from 'vitest';
import { VirtualList } from '../src/components/VirtualList';

function makeRecord(id: number) {
  return {
    id,
    project_id: 1, project_name: 'P', floor_id: 1, floor_name: '1层',
    area_id: 1, area_name: '区',
    hazard_type_id: 1, hazard_type_name: 'T', hazard_type_parent_name: 'TP',
    group_id: 1, group_name: 'G',
    description: `desc${id}`,
    executor_id: 1, executor_name: 'E',
    supervisor_id: null, supervisor_name: null,
    deadline_date: null,
    rectification_desc: null,
    review_comment: null,
    is_overdue: false, overdue_days: 0, remaining_days: null,
    warning_status: 'normal' as const,
    status: 'pending' as const,
    rectified_at: null, reviewed_at: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  } as any;
}

describe('VirtualList', () => {
  it('renders structure and triggers initial loadData', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const loadData = vi.fn().mockResolvedValue({
      list: [makeRecord(1), makeRecord(2)],
      total: 2,
    });

    new VirtualList(container, {
      itemHeight: 60,
      containerHeight: 300,
      loadData,
    });

    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(loadData).toHaveBeenCalledWith(1, 50);
    expect(container.querySelector('.virtual-list-container')).not.toBeNull();
    expect(container.querySelectorAll('.virtual-list-item').length).toBe(2);
  });

  it('shows "暂无数据" when total is 0', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    new VirtualList(container, {
      itemHeight: 60,
      containerHeight: 300,
      loadData: vi.fn().mockResolvedValue({ list: [], total: 0 }),
    });

    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    expect(container.querySelector('.empty')?.textContent).toBe('暂无数据');
  });

  it('triggers onItemClick when item clicked', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const onItemClick = vi.fn();
    new VirtualList(container, {
      itemHeight: 60,
      containerHeight: 300,
      loadData: vi.fn().mockResolvedValue({ list: [makeRecord(7)], total: 1 }),
      onItemClick,
    });
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    (container.querySelector('.virtual-list-item') as HTMLElement).click();
    expect(onItemClick).toHaveBeenCalled();
    expect(onItemClick.mock.calls[0][0].id).toBe(7);
  });

  it('uses custom renderItem when provided', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    new VirtualList(container, {
      itemHeight: 60,
      containerHeight: 300,
      loadData: vi.fn().mockResolvedValue({ list: [makeRecord(1)], total: 1 }),
      renderItem: (item) => {
        const el = document.createElement('div');
        el.className = 'custom-row';
        el.textContent = `id-${item.id}`;
        return el;
      },
    });
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    expect(container.querySelector('.custom-row')?.textContent).toBe('id-1');
  });

  it('refresh re-loads first page', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const loadData = vi.fn().mockResolvedValue({ list: [makeRecord(1)], total: 1 });
    const list = new VirtualList(container, {
      itemHeight: 60, containerHeight: 300, loadData,
    });
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    expect(loadData).toHaveBeenCalledTimes(1);
    await list.refresh();
    expect(loadData).toHaveBeenCalledTimes(2);
  });

  it('reset clears data and shows empty placeholder', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const list = new VirtualList(container, {
      itemHeight: 60, containerHeight: 300,
      loadData: vi.fn().mockResolvedValue({ list: [makeRecord(1)], total: 1 }),
    });
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    list.reset();
    expect(container.querySelector('.virtual-list-content .empty')?.textContent).toBe('暂无数据');
  });

  it('removes failed page from loadedPages so it can be retried', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const loadData = vi.fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ list: [makeRecord(1)], total: 1 });
    const list = new VirtualList(container, {
      itemHeight: 60, containerHeight: 300, loadData,
    });
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    await list.refresh();
    expect(loadData).toHaveBeenCalledTimes(2);
  });
});
