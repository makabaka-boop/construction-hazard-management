import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { VirtualList } from '../src/components/VirtualList';
import { mockHazards } from './mocks/data';
import { createContainer, cleanupContainer } from './setup';

describe('虚拟列表组件测试', () => {
  let container: HTMLElement;
  let loadDataMock: any;
  let onItemClickMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    container = createContainer();
    loadDataMock = vi.fn().mockImplementation((page: number, pageSize: number) => {
      const start = (page - 1) * pageSize;
      return Promise.resolve({
        list: mockHazards.slice(start, start + pageSize),
        total: mockHazards.length,
      });
    });
    onItemClickMock = vi.fn();
  });

  afterEach(() => {
    cleanupContainer(container);
  });

  it('应该正确渲染虚拟列表容器', () => {
    const list = new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 500,
      loadData: loadDataMock,
    });

    expect(container.querySelector('.virtual-list-container')).toBeInTheDocument();
    expect(container.querySelector('.virtual-list-phantom')).toBeInTheDocument();
    expect(container.querySelector('.virtual-list-content')).toBeInTheDocument();
  });

  it('初始化时应该加载第一页数据', async () => {
    const list = new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 500,
      loadData: loadDataMock,
    });

    await vi.waitFor(() => {
      expect(loadDataMock).toHaveBeenCalledWith(1, 50);
    });
  });

  it('应该正确渲染列表项', async () => {
    const list = new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 500,
      loadData: loadDataMock,
    });

    await vi.waitFor(() => {
      const items = container.querySelectorAll('.virtual-list-item');
      expect(items.length).toBeGreaterThan(0);
    });
  });

  it('点击列表项应该触发onItemClick回调', async () => {
    const list = new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 500,
      loadData: loadDataMock,
      onItemClick: onItemClickMock,
    });

    await vi.waitFor(() => {
      const firstItem = container.querySelector('.virtual-list-item');
      expect(firstItem).toBeInTheDocument();
      fireEvent.click(firstItem!);
      expect(onItemClickMock).toHaveBeenCalled();
    });
  });

  it('应该支持自定义渲染项', async () => {
    const renderItemMock = vi.fn().mockImplementation((item) => {
      const el = document.createElement('div');
      el.className = 'custom-item';
      el.textContent = `Custom: ${item.id}`;
      return el;
    });

    const list = new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 500,
      loadData: loadDataMock,
      renderItem: renderItemMock,
    });

    await vi.waitFor(() => {
      expect(container.querySelector('.custom-item')).toBeInTheDocument();
      expect(renderItemMock).toHaveBeenCalled();
    });
  });

  it('refresh方法应该重置并重新加载数据', async () => {
    const list = new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 500,
      loadData: loadDataMock,
    });

    await vi.waitFor(() => {
      expect(loadDataMock).toHaveBeenCalledTimes(1);
    });

    list.refresh();

    await vi.waitFor(() => {
      expect(loadDataMock).toHaveBeenCalledTimes(2);
    });
  });

  it('reset方法应该清空列表', async () => {
    const list = new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 500,
      loadData: loadDataMock,
    });

    await vi.waitFor(() => {
      expect(container.querySelector('.virtual-list-item')).toBeInTheDocument();
    });

    list.reset();

    expect(container.querySelector('.empty')).toBeInTheDocument();
    expect(container.querySelector('.virtual-list-item')).not.toBeInTheDocument();
  });

  it('数据加载失败应该处理错误', async () => {
    const failingLoad = vi.fn().mockRejectedValue(new Error('加载失败'));
    
    const list = new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 500,
      loadData: failingLoad,
    });

    await vi.waitFor(() => {
      expect(failingLoad).toHaveBeenCalled();
    });
  });

  it('空数据应该显示空状态', async () => {
    const emptyLoad = vi.fn().mockResolvedValue({ list: [], total: 0 });
    
    const list = new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 500,
      loadData: emptyLoad,
    });

    await vi.waitFor(() => {
      expect(container.querySelector('.empty')).toBeInTheDocument();
      expect(container.textContent).toContain('暂无数据');
    });
  });

  it('phantom元素应该设置正确的总高度', async () => {
    const list = new VirtualList(container, {
      itemHeight: 80,
      containerHeight: 500,
      loadData: loadDataMock,
    });

    await vi.waitFor(() => {
      const phantom = container.querySelector('.virtual-list-phantom') as HTMLElement;
      expect(phantom.style.height).toBe(`${mockHazards.length * 80}px`);
    });
  });
});
