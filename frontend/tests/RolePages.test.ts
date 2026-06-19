import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutorPage } from '../src/pages/ExecutorPage';
import { SupervisorPage } from '../src/pages/SupervisorPage';
import * as apiModule from '../src/services/api';

const executorUser = { id: 2, username: 'executor', role: 'executor', name: '张三' };
const supervisorUser = { id: 4, username: 'supervisor', role: 'supervisor', name: '王监督' };

beforeEach(() => {
  localStorage.setItem('token', 'tk');
  vi.spyOn(apiModule.commonApi, 'getAllProjects').mockResolvedValue([]);
  vi.spyOn(apiModule.commonApi, 'getAllFloors').mockResolvedValue([]);
  vi.spyOn(apiModule.commonApi, 'getAllAreas').mockResolvedValue([]);
  vi.spyOn(apiModule.commonApi, 'getAllHazardTypes').mockResolvedValue([]);
  vi.spyOn(apiModule.commonApi, 'getAllGroups').mockResolvedValue([
    { id: 1, name: '电气组', leader: '张三', phone: '13800000001', created_at: '' },
  ]);
  vi.spyOn(apiModule.commonApi, 'getAllDeadlineRules').mockResolvedValue([]);
});

describe('ExecutorPage', () => {
  it('renders header with user name and filter inputs', async () => {
    localStorage.setItem('user', JSON.stringify(executorUser));
    vi.spyOn(apiModule.executorApi, 'getHazards').mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 50 });

    const c = document.createElement('div');
    document.body.appendChild(c);
    new ExecutorPage(c);
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(c.textContent).toContain('张三');
    expect(c.querySelector('#searchBtn')).not.toBeNull();
    expect(c.querySelector('#exportBtn')).not.toBeNull();
    expect(c.querySelector('#groupId option[value="1"]')?.textContent).toBe('电气组');
  });

  it('export button calls export api and downloads', async () => {
    localStorage.setItem('user', JSON.stringify(executorUser));
    vi.spyOn(apiModule.executorApi, 'getHazards').mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 50 });
    const expSpy = vi.spyOn(apiModule.executorApi, 'exportHazards').mockResolvedValue(new Blob(['x']));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const c = document.createElement('div');
    document.body.appendChild(c);
    new ExecutorPage(c);
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    (c.querySelector('#exportBtn') as HTMLButtonElement).click();
    await new Promise(r => setTimeout(r, 0));
    expect(expSpy).toHaveBeenCalled();
  });

  it('logout clears user and redirects', async () => {
    localStorage.setItem('user', JSON.stringify(executorUser));
    vi.spyOn(apiModule.executorApi, 'getHazards').mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 50 });
    const c = document.createElement('div');
    document.body.appendChild(c);
    new ExecutorPage(c);
    await new Promise(r => setTimeout(r, 0));
    (c.querySelector('#logoutBtn') as HTMLButtonElement).click();
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.hash).toBe('#/login');
  });
});

describe('SupervisorPage', () => {
  it('renders supervisor header and filters', async () => {
    localStorage.setItem('user', JSON.stringify(supervisorUser));
    vi.spyOn(apiModule.supervisorApi, 'getHazards').mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 50 });

    const c = document.createElement('div');
    document.body.appendChild(c);
    new SupervisorPage(c);
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(c.textContent).toContain('王监督');
    expect(c.querySelector('#searchBtn')).not.toBeNull();
    expect(c.querySelector('#exportBtn')).not.toBeNull();
  });

  it('export uses commonApi.exportHazards', async () => {
    localStorage.setItem('user', JSON.stringify(supervisorUser));
    vi.spyOn(apiModule.supervisorApi, 'getHazards').mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 50 });
    const expSpy = vi.spyOn(apiModule.commonApi, 'exportHazards').mockResolvedValue(new Blob(['x']));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const c = document.createElement('div');
    document.body.appendChild(c);
    new SupervisorPage(c);
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    (c.querySelector('#exportBtn') as HTMLButtonElement).click();
    await new Promise(r => setTimeout(r, 0));
    expect(expSpy).toHaveBeenCalled();
  });
});
