import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminPage } from '../src/pages/AdminPage';
import * as apiModule from '../src/services/api';

const adminUser = { id: 1, username: 'admin', role: 'admin', name: '管理员' };

describe('AdminPage', () => {
  let container: HTMLElement;
  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify(adminUser));
    localStorage.setItem('token', 'tk');
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('renders header tabs and shows admin name', async () => {
    vi.spyOn(apiModule.adminApi, 'getProjects').mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 20 });
    new AdminPage(container);
    expect(container.textContent).toContain('管理员');
    expect(container.querySelectorAll('.tab-item').length).toBeGreaterThanOrEqual(6);
  });

  it('switching tab triggers correct api', async () => {
    const proj = vi.spyOn(apiModule.adminApi, 'getProjects').mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 20 });
    const groups = vi.spyOn(apiModule.adminApi, 'getGroups').mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 20 });
    new AdminPage(container);
    await new Promise(r => setTimeout(r, 0));
    expect(proj).toHaveBeenCalled();

    const groupsTab = Array.from(container.querySelectorAll<HTMLElement>('.tab-item'))
      .find(t => t.dataset.tab === 'groups')!;
    groupsTab.click();
    await new Promise(r => setTimeout(r, 0));
    expect(groups).toHaveBeenCalled();
  });

  it('logout button clears localStorage and redirects', async () => {
    vi.spyOn(apiModule.adminApi, 'getProjects').mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 20 });
    new AdminPage(container);
    await new Promise(r => setTimeout(r, 0));
    (container.querySelector('#logoutBtn') as HTMLButtonElement).click();
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.hash).toBe('#/login');
  });

  it('renders project rows after loading', async () => {
    vi.spyOn(apiModule.adminApi, 'getProjects').mockResolvedValue({
      list: [{ id: 1, name: '测试项目', code: 'P01', created_at: '2024-01-01T00:00:00.000Z' }],
      total: 1, page: 1, pageSize: 20,
    });
    new AdminPage(container);
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    expect(container.textContent).toContain('测试项目');
    expect(container.textContent).toContain('P01');
  });

  it('shows error toast when api fails', async () => {
    vi.spyOn(apiModule.adminApi, 'getProjects').mockRejectedValue(new Error('权限不足'));
    new AdminPage(container);
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    expect(document.querySelector('.toast.toast-error')?.textContent).toContain('权限不足');
  });

  it('search button reloads list with current keyword', async () => {
    const spy = vi.spyOn(apiModule.adminApi, 'getProjects').mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 20 });
    new AdminPage(container);
    await new Promise(r => setTimeout(r, 0));
    (container.querySelector('#searchInput') as HTMLInputElement).value = 'kw';
    (container.querySelector('#searchBtn') as HTMLButtonElement).click();
    await new Promise(r => setTimeout(r, 0));
    const lastCall = spy.mock.calls[spy.mock.calls.length - 1];
    expect(lastCall[2]).toBe('kw');
  });
});
