import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CascadeDropdown, createHazardCascade } from '../src/components/CascadeDropdown';
import { mockProjects, mockFloors, mockAreas } from './mocks';

describe('级联下拉组件测试', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.resetAllMocks();
  });

  afterEach(() => {
    container.remove();
  });

  it('应该渲染级联下拉容器和触发器', () => {
    new CascadeDropdown(container, {
      levels: [],
      placeholder: '请选择',
    });

    expect(container.querySelector('.cascade-dropdown')).not.toBeNull();
    expect(container.querySelector('.cascade-trigger')).not.toBeNull();
    expect(container.querySelector('.cascade-trigger')?.textContent).toBe('请选择');
  });

  it('点击触发器应该展开面板', async () => {
    const loadProjects = vi.fn().mockResolvedValue(mockProjects);
    new CascadeDropdown(container, {
      levels: [
        {
          key: 'projectId',
          label: '项目',
          loadOptions: loadProjects,
        },
      ],
    });

    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    trigger.click();

    await new Promise(resolve => setTimeout(resolve, 0));

    const panel = container.querySelector('.cascade-panel') as HTMLElement;
    expect(panel.style.display).not.toBe('none');
    expect(loadProjects).toHaveBeenCalled();
  });

  it('展开面板应该显示选项列', async () => {
    const loadProjects = vi.fn().mockResolvedValue(mockProjects);
    new CascadeDropdown(container, {
      levels: [
        {
          key: 'projectId',
          label: '项目',
          loadOptions: loadProjects,
        },
      ],
    });

    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    trigger.click();

    await new Promise(resolve => setTimeout(resolve, 0));

    const options = container.querySelectorAll('.cascade-option');
    expect(options.length).toBe(mockProjects.length);
    expect(options[0].textContent).toContain(mockProjects[0].name);
  });

  it('点击选项应该选择并触发onChange', async () => {
    const loadProjects = vi.fn().mockResolvedValue(mockProjects);
    const onChange = vi.fn();

    new CascadeDropdown(container, {
      levels: [
        {
          key: 'projectId',
          label: '项目',
          loadOptions: loadProjects,
        },
      ],
      onChange,
    });

    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    trigger.click();

    await new Promise(resolve => setTimeout(resolve, 0));

    const options = container.querySelectorAll('.cascade-option');
    (options[0] as HTMLElement).click();

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(onChange).toHaveBeenCalled();
    const values = onChange.mock.calls[0][0];
    expect(values.projectId).toBe(mockProjects[0].id);
    expect(container.querySelector('.cascade-trigger')?.textContent).toContain(mockProjects[0].name);
  });

  it('有子级时选择应该加载下一级选项', async () => {
    const loadProjects = vi.fn().mockResolvedValue(mockProjects);
    const loadFloors = vi.fn().mockResolvedValue(mockFloors);

    new CascadeDropdown(container, {
      levels: [
        {
          key: 'projectId',
          label: '项目',
          loadOptions: loadProjects,
          hasChildren: true,
        },
        {
          key: 'floorId',
          label: '楼层',
          loadOptions: loadFloors,
        },
      ],
    });

    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    trigger.click();

    await new Promise(resolve => setTimeout(resolve, 0));

    const projectOptions = container.querySelectorAll('.cascade-option');
    (projectOptions[0] as HTMLElement).click();

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(loadFloors).toHaveBeenCalledWith(mockProjects[0].id);
    const columns = container.querySelectorAll('.cascade-column');
    expect(columns.length).toBe(2);
  });

  it('getValue应该返回当前选中值', async () => {
    const loadProjects = vi.fn().mockResolvedValue(mockProjects);

    const dropdown = new CascadeDropdown(container, {
      levels: [
        {
          key: 'projectId',
          label: '项目',
          loadOptions: loadProjects,
        },
      ],
    });

    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    trigger.click();

    await new Promise(resolve => setTimeout(resolve, 0));

    const options = container.querySelectorAll('.cascade-option');
    (options[1] as HTMLElement).click();

    const values = dropdown.getValue();
    expect(values.projectId).toBe(mockProjects[1].id);
  });

  it('clear应该清空选择', async () => {
    const loadProjects = vi.fn().mockResolvedValue(mockProjects);

    const dropdown = new CascadeDropdown(container, {
      levels: [
        {
          key: 'projectId',
          label: '项目',
          loadOptions: loadProjects,
        },
      ],
    });

    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    trigger.click();

    await new Promise(resolve => setTimeout(resolve, 0));

    const options = container.querySelectorAll('.cascade-option');
    (options[0] as HTMLElement).click();

    dropdown.clear();

    expect(dropdown.getValue().projectId).toBeUndefined();
    expect(container.querySelector('.cascade-trigger')?.textContent).toBe('请选择');
  });

  it('点击外部应该关闭面板', async () => {
    const loadProjects = vi.fn().mockResolvedValue(mockProjects);
    new CascadeDropdown(container, {
      levels: [
        {
          key: 'projectId',
          label: '项目',
          loadOptions: loadProjects,
        },
      ],
    });

    const trigger = container.querySelector('.cascade-trigger') as HTMLElement;
    trigger.click();

    await new Promise(resolve => setTimeout(resolve, 0));

    document.body.click();

    await new Promise(resolve => setTimeout(resolve, 0));

    const panel = container.querySelector('.cascade-panel') as HTMLElement;
    expect(panel.style.display).toBe('none');
  });

  it('createHazardCascade工厂函数应该创建三级级联', () => {
    const dropdown = createHazardCascade(container);
    expect(dropdown).toBeInstanceOf(CascadeDropdown);
    expect(container.querySelector('.cascade-trigger')?.textContent).toBe('选择筛选条件');
  });
});
