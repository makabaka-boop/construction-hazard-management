import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VirtualList } from '../src/components/VirtualList';
import { mockHazards } from './mocks';

describe('虚拟列表组件测试', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    container.remove();
    vi.useRealTimers();
  });

  it('应该渲染虚拟列表容器', () => {
    const loadData = vi.fn().mockResolvedValue({ list: [], total: 0 });
    new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 400,
      loadData,
    });

    expect(container.querySelector('.virtual-list-container')).not.toBeNull();
    expect(container.querySelector('.virtual-list-phantom')).not.toBeNull();
    expect(container.querySelector('.virtual-list-content')).not.toBeNull();
  });

  it('应该调用loadData加载第一页数据', async () => {
    const loadData = vi.fn().mockResolvedValue({ list: mockHazards, total: mockHazards.length });
    new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 400,
      loadData,
    });

    await vi.runAllTimersAsync();
    expect(loadData).toHaveBeenCalledWith(1, 50);
  });

  it('应该渲染数据项', async () => {
    const loadData = vi.fn().mockResolvedValue({ list: mockHazards, total: mockHazards.length });
    new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 400,
      loadData,
    });

    await vi.runAllTimersAsync();

    const items = container.querySelectorAll('.virtual-list-item');
    expect(items.length).toBeGreaterThan(0);
  });

  it('没有数据时应该显示空状态', async () => {
    const loadData = vi.fn().mockResolvedValue({ list: [], total: 0 });
    new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 400,
      loadData,
    });

    await vi.runAllTimersAsync();

    const empty = container.querySelector('.empty');
    expect(empty).not.toBeNull();
    expect(empty?.textContent).toBe('暂无数据');
  });

  it('应该使用自定义renderItem', async () => {
    const loadData = vi.fn().mockResolvedValue({ list: mockHazards, total: mockHazards.length });
    const renderItem = vi.fn((item) => {
      const el = document.createElement('div');
      el.className = 'custom-item';
      el.textContent = item.description;
      return el;
    });

    new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 400,
      loadData,
      renderItem,
    });

    await vi.runAllTimersAsync();

    expect(renderItem).toHaveBeenCalled();
    expect(container.querySelector('.custom-item')).not.toBeNull();
  });

  it('点击项目应该触发onItemClick', async () => {
    const loadData = vi.fn().mockResolvedValue({ list: mockHazards, total: mockHazards.length });
    const onItemClick = vi.fn();

    new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 400,
      loadData,
      onItemClick,
    });

    await vi.runAllTimersAsync();

    const firstItem = container.querySelector('.virtual-list-item') as HTMLElement;
    firstItem?.click();

    expect(onItemClick).toHaveBeenCalled();
  });

  it('refresh应该重新加载数据', async () => {
    const loadData = vi.fn().mockResolvedValue({ list: mockHazards, total: mockHazards.length });
    const list = new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 400,
      loadData,
    });

    await vi.runAllTimersAsync();
    loadData.mockClear();

    await list.refresh();
    await vi.runAllTimersAsync();

    expect(loadData).toHaveBeenCalledWith(1, 50);
  });

  it('reset应该清空列表', async () => {
    const loadData = vi.fn().mockResolvedValue({ list: mockHazards, total: mockHazards.length });
    const list = new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 400,
      loadData,
    });

    await vi.runAllTimersAsync();
    list.reset();

    const empty = container.querySelector('.empty');
    expect(empty?.textContent).toBe('暂无数据');
  });

  it('默认渲染应该显示状态和预警信息', async () => {
    const loadData = vi.fn().mockResolvedValue({ list: mockHazards, total: mockHazards.length });
    new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 400,
      loadData,
    });

    await vi.runAllTimersAsync();

    const content = container.textContent || '';
    expect(content).toContain('测试隐患1');
  });
});
