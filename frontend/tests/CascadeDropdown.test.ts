import { describe, it, expect, vi } from 'vitest';
import { CascadeDropdown, createHazardCascade, createHazardTypeCascade } from '../src/components/CascadeDropdown';
import * as apiModule from '../src/services/api';

describe('CascadeDropdown', () => {
  it('renders trigger with placeholder', () => {
    const container = document.createElement('div');
    new CascadeDropdown(container, {
      placeholder: '请选择',
      levels: [
        { key: 'a', label: 'A', loadOptions: vi.fn().mockResolvedValue([]) },
      ],
    });
    expect(container.querySelector('.cascade-trigger')?.textContent).toBe('请选择');
  });

  it('opens panel and loads first level on click', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const loadL1 = vi.fn().mockResolvedValue([
      { id: 1, name: '项目A', code: 'P1' },
      { id: 2, name: '项目B', code: 'P2' },
    ]);
    new CascadeDropdown(container, {
      placeholder: '请选择项目',
      levels: [
        { key: 'projectId', label: '项目', loadOptions: loadL1 },
      ],
    });

    (container.querySelector('.cascade-trigger') as HTMLElement).click();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(loadL1).toHaveBeenCalled();
    const options = container.querySelectorAll('.cascade-option');
    expect(options.length).toBe(2);
    expect(options[0].textContent).toContain('项目A');
  });

  it('selecting an option triggers onChange and updates trigger text', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const onChange = vi.fn();
    const loadL1 = vi.fn().mockResolvedValue([{ id: 1, name: '项目A', code: 'P1' }]);
    const loadL2 = vi.fn().mockResolvedValue([{ id: 11, name: '1层', code: 'F1' }]);
    new CascadeDropdown(container, {
      levels: [
        { key: 'projectId', label: '项目', loadOptions: loadL1, hasChildren: true },
        { key: 'floorId', label: '楼层', loadOptions: loadL2 },
      ],
      onChange,
    });

    (container.querySelector('.cascade-trigger') as HTMLElement).click();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    const firstOption = container.querySelectorAll('.cascade-column')[0].querySelector('.cascade-option') as HTMLElement;
    firstOption.click();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(onChange).toHaveBeenCalled();
    expect(loadL2).toHaveBeenCalledWith(1);
    expect(container.querySelector('.cascade-trigger')?.textContent).toContain('项目A');
  });

  it('clear() resets values and labels', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const loadL1 = vi.fn().mockResolvedValue([{ id: 1, name: '项目A', code: 'P1' }]);
    const cd = new CascadeDropdown(container, {
      placeholder: '默认',
      levels: [{ key: 'projectId', label: '项目', loadOptions: loadL1 }],
    });
    (container.querySelector('.cascade-trigger') as HTMLElement).click();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    (container.querySelector('.cascade-option') as HTMLElement).click();
    await new Promise(r => setTimeout(r, 0));
    expect(cd.getValue().projectId).toBe(1);

    cd.clear();
    expect(cd.getValue().projectId).toBeUndefined();
    expect(container.querySelector('.cascade-trigger')?.textContent).toBe('默认');
  });

  it('shows "暂无数据" when level data empty', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    new CascadeDropdown(container, {
      levels: [{ key: 'a', label: 'A', loadOptions: vi.fn().mockResolvedValue([]) }],
    });
    (container.querySelector('.cascade-trigger') as HTMLElement).click();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    expect(container.querySelector('.empty')?.textContent).toBe('暂无数据');
  });

  it('falls back to empty list when loadOptions throws', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    new CascadeDropdown(container, {
      levels: [{ key: 'a', label: 'A', loadOptions: vi.fn().mockRejectedValue(new Error('fail')) }],
    });
    (container.querySelector('.cascade-trigger') as HTMLElement).click();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    expect(container.querySelector('.empty')?.textContent).toBe('暂无数据');
  });
});

describe('CascadeDropdown factories', () => {
  it('createHazardCascade wires commonApi.getAllProjects', async () => {
    const projSpy = vi.spyOn(apiModule.commonApi, 'getAllProjects').mockResolvedValue([{ id: 1, name: 'P', code: 'C', created_at: '' }]);
    const container = document.createElement('div');
    document.body.appendChild(container);
    createHazardCascade(container);
    (container.querySelector('.cascade-trigger') as HTMLElement).click();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    expect(projSpy).toHaveBeenCalled();
  });

  it('createHazardTypeCascade loads root parent_id null', async () => {
    const spy = vi.spyOn(apiModule.commonApi, 'getAllHazardTypes').mockResolvedValue([{ id: 1, name: 'T', code: 'C', parent_id: null, created_at: '' }]);
    const container = document.createElement('div');
    document.body.appendChild(container);
    createHazardTypeCascade(container);
    (container.querySelector('.cascade-trigger') as HTMLElement).click();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    expect(spy).toHaveBeenCalledWith(null);
  });
});
