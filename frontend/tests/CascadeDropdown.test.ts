import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/dom';
import { CascadeDropdown } from '../src/components/CascadeDropdown';
import { mockProjects, mockFloors, mockAreas } from './mocks/data';
import { createContainer, cleanupContainer } from './setup';

describe('级联下拉组件测试', () => {
  let container: HTMLElement;
  let onChangeMock: any;
  let loadProjectsMock: any;
  let loadFloorsMock: any;
  let loadAreasMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    container = createContainer();
    onChangeMock = vi.fn();
    
    loadProjectsMock = vi.fn().mockResolvedValue(mockProjects);
    loadFloorsMock = vi.fn().mockImplementation((parentId?: number) => {
      return Promise.resolve(mockFloors.filter(f => f.project_id === parentId));
    });
    loadAreasMock = vi.fn().mockImplementation((parentId?: number) => {
      return Promise.resolve(mockAreas.filter(a => a.floor_id === parentId));
    });
  });

  afterEach(() => {
    cleanupContainer(container);
  });

  function createThreeLevelCascade() {
    return new CascadeDropdown(container, {
      placeholder: '请选择位置',
      levels: [
        { key: 'projectId', label: '项目', loadOptions: loadProjectsMock, hasChildren: true },
        { key: 'floorId', label: '楼层', loadOptions: loadFloorsMock, hasChildren: true },
        { key: 'areaId', label: '区域', loadOptions: loadAreasMock, hasChildren: false },
      ],
      onChange: onChangeMock,
    });
  }

  it('应该正确渲染触发器和默认提示文字', () => {
    createThreeLevelCascade();
    
    const trigger = container.querySelector('.cascade-trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger?.textContent).toBe('请选择位置');
  });

  it('点击触发器应该打开下拉面板', async () => {
    createThreeLevelCascade();
    
    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    fireEvent.click(trigger);
    
    await waitFor(() => {
      const panel = container.querySelector('.cascade-panel') as HTMLElement;
      expect(panel.style.display).not.toBe('none');
      expect(container.querySelector('.cascade-dropdown')?.classList.contains('open')).toBe(true);
    });
  });

  it('打开时应该加载第一级数据', async () => {
    createThreeLevelCascade();
    
    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(loadProjectsMock).toHaveBeenCalled();
      const options = container.querySelectorAll('.cascade-option');
      expect(options.length).toBe(mockProjects.length);
    });
  });

  it('选择第一级选项应该触发onChange并加载第二级', async () => {
    createThreeLevelCascade();
    
    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(container.querySelectorAll('.cascade-option').length).toBeGreaterThan(0);
    });
    
    const firstOption = container.querySelectorAll('.cascade-option')[0] as HTMLElement;
    fireEvent.click(firstOption);
    
    await waitFor(() => {
      expect(onChangeMock).toHaveBeenCalled();
      expect(loadFloorsMock).toHaveBeenCalledWith(mockProjects[0].id);
    });
  });

  it('选择选项后应该更新触发器显示文字', async () => {
    createThreeLevelCascade();
    
    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(container.querySelectorAll('.cascade-option').length).toBeGreaterThan(0);
    });
    
    const firstOption = container.querySelectorAll('.cascade-option')[0] as HTMLElement;
    fireEvent.click(firstOption);
    
    await waitFor(() => {
      expect(trigger.textContent).toBe(mockProjects[0].name);
    });
  });

  it('应该正确标记选中项为active', async () => {
    createThreeLevelCascade();
    
    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(container.querySelectorAll('.cascade-option').length).toBeGreaterThan(0);
    });
    
    const firstOption = container.querySelectorAll('.cascade-option')[0] as HTMLElement;
    fireEvent.click(firstOption);
    
    await waitFor(() => {
      const options = container.querySelectorAll('.cascade-option');
      expect(options[0].classList.contains('active')).toBe(true);
    });
  });

  it('有子级的选项应该显示箭头', async () => {
    createThreeLevelCascade();
    
    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    fireEvent.click(trigger);
    
    await waitFor(() => {
      const options = container.querySelectorAll('.cascade-option');
      const arrows = container.querySelectorAll('.has-children');
      expect(arrows.length).toBe(mockProjects.length);
    });
  });

  it('getValue应该返回当前选中的值', async () => {
    const cascade = createThreeLevelCascade();
    
    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(container.querySelectorAll('.cascade-option').length).toBeGreaterThan(0);
    });
    
    const firstOption = container.querySelectorAll('.cascade-option')[0] as HTMLElement;
    fireEvent.click(firstOption);
    
    const value = cascade.getValue();
    expect(value.projectId).toBe(mockProjects[0].id);
  });

  it('getLabels应该返回当前选中的标签', async () => {
    const cascade = createThreeLevelCascade();
    
    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(container.querySelectorAll('.cascade-option').length).toBeGreaterThan(0);
    });
    
    const firstOption = container.querySelectorAll('.cascade-option')[0] as HTMLElement;
    fireEvent.click(firstOption);
    
    const labels = cascade.getLabels();
    expect(labels.projectId).toBe(mockProjects[0].name);
  });

  it('clear方法应该清空选择', async () => {
    const cascade = createThreeLevelCascade();
    
    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(container.querySelectorAll('.cascade-option').length).toBeGreaterThan(0);
    });
    
    const firstOption = container.querySelectorAll('.cascade-option')[0] as HTMLElement;
    fireEvent.click(firstOption);
    
    cascade.clear();
    
    expect(trigger.textContent).toBe('请选择位置');
    expect(cascade.getValue()).toEqual({});
    const panel = container.querySelector('.cascade-panel') as HTMLElement;
    expect(panel.style.display).toBe('none');
  });

  it('点击外部应该关闭下拉面板', async () => {
    createThreeLevelCascade();
    
    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(container.querySelector('.cascade-dropdown')?.classList.contains('open')).toBe(true);
    });
    
    fireEvent.click(document.body);
    
    expect(container.querySelector('.cascade-dropdown')?.classList.contains('open')).toBe(false);
  });

  it('每列应该有搜索框', async () => {
    createThreeLevelCascade();
    
    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    fireEvent.click(trigger);
    
    await waitFor(() => {
      const searchInputs = container.querySelectorAll('.cascade-search input');
      expect(searchInputs.length).toBe(3);
    });
  });

  it('搜索应该过滤选项', async () => {
    vi.useFakeTimers();
    createThreeLevelCascade();
    
    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(container.querySelectorAll('.cascade-option').length).toBe(mockProjects.length);
    });
    
    const searchInput = container.querySelector('.cascade-search input') as HTMLInputElement;
    fireEvent.input(searchInput, { target: { value: '城市' } });
    
    vi.advanceTimersByTime(300);
    
    await waitFor(() => {
      const options = container.querySelectorAll('.cascade-option');
      expect(options.length).toBe(1);
    });
    
    vi.useRealTimers();
  });

  it('无数据时应该显示暂无数据', async () => {
    loadProjectsMock.mockResolvedValue([]);
    createThreeLevelCascade();
    
    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(container.querySelector('.empty')).toBeInTheDocument();
      expect(container.textContent).toContain('暂无数据');
    });
  });

  it('选择父级应该重置子级选择', async () => {
    const cascade = createThreeLevelCascade();
    
    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(container.querySelectorAll('.cascade-option').length).toBeGreaterThan(0);
    });
    
    const firstOption = container.querySelectorAll('.cascade-option')[0] as HTMLElement;
    fireEvent.click(firstOption);
    
    const value = cascade.getValue();
    expect(value.projectId).toBeDefined();
    
    const secondOption = container.querySelectorAll('.cascade-option')[1] as HTMLElement;
    fireEvent.click(secondOption);
    
    const newValue = cascade.getValue();
    expect(newValue.projectId).toBe(mockProjects[1].id);
    expect(newValue.floorId).toBeUndefined();
  });
});
