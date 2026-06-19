import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from '../src/pages/LoginPage';
import * as apiModule from '../src/services/api';

describe('LoginPage', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    window.location.hash = '';
  });

  it('renders form fields and test account hints', () => {
    new LoginPage(container);
    expect(container.querySelector('#username')).not.toBeNull();
    expect(container.querySelector('#password')).not.toBeNull();
    expect(container.querySelector('#loginBtn')).not.toBeNull();
    expect(container.textContent).toContain('施工隐患管理系统');
    expect(container.textContent).toContain('admin / admin123');
  });

  it('shows error toast when fields are empty', async () => {
    new LoginPage(container);
    const btn = container.querySelector('#loginBtn') as HTMLButtonElement;
    btn.click();
    await Promise.resolve();
    const toast = document.querySelector('.toast.toast-error');
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain('请输入用户名和密码');
  });

  it('calls authApi.login and redirects admin to #/admin', async () => {
    const spy = vi.spyOn(apiModule.authApi, 'login').mockResolvedValue({
      token: 'tk',
      user: { id: 1, username: 'admin', role: 'admin', name: '管理员' },
    });
    new LoginPage(container);
    (container.querySelector('#username') as HTMLInputElement).value = 'admin';
    (container.querySelector('#password') as HTMLInputElement).value = 'admin123';
    (container.querySelector('#loginBtn') as HTMLButtonElement).click();
    await new Promise(r => setTimeout(r, 0));
    expect(spy).toHaveBeenCalledWith('admin', 'admin123');
    expect(localStorage.getItem('token')).toBe('tk');
    expect(window.location.hash).toBe('#/admin');
  });

  it('redirects executor to #/executor', async () => {
    vi.spyOn(apiModule.authApi, 'login').mockResolvedValue({
      token: 'tk',
      user: { id: 2, username: 'executor', role: 'executor', name: '张三' },
    });
    new LoginPage(container);
    (container.querySelector('#username') as HTMLInputElement).value = 'executor';
    (container.querySelector('#password') as HTMLInputElement).value = 'exec123';
    (container.querySelector('#loginBtn') as HTMLButtonElement).click();
    await new Promise(r => setTimeout(r, 0));
    expect(window.location.hash).toBe('#/executor');
  });

  it('redirects supervisor to #/supervisor', async () => {
    vi.spyOn(apiModule.authApi, 'login').mockResolvedValue({
      token: 'tk',
      user: { id: 4, username: 'supervisor', role: 'supervisor', name: '王监督' },
    });
    new LoginPage(container);
    (container.querySelector('#username') as HTMLInputElement).value = 'supervisor';
    (container.querySelector('#password') as HTMLInputElement).value = 'super123';
    (container.querySelector('#loginBtn') as HTMLButtonElement).click();
    await new Promise(r => setTimeout(r, 0));
    expect(window.location.hash).toBe('#/supervisor');
  });

  it('shows error toast when login fails', async () => {
    vi.spyOn(apiModule.authApi, 'login').mockRejectedValue(new Error('用户名或密码错误'));
    new LoginPage(container);
    (container.querySelector('#username') as HTMLInputElement).value = 'admin';
    (container.querySelector('#password') as HTMLInputElement).value = 'wrong';
    (container.querySelector('#loginBtn') as HTMLButtonElement).click();
    await new Promise(r => setTimeout(r, 0));
    const toast = document.querySelector('.toast.toast-error');
    expect(toast?.textContent).toContain('用户名或密码错误');
  });

  it('submits when pressing Enter in password input', async () => {
    const spy = vi.spyOn(apiModule.authApi, 'login').mockResolvedValue({
      token: 'tk',
      user: { id: 1, username: 'admin', role: 'admin', name: 'A' },
    });
    new LoginPage(container);
    (container.querySelector('#username') as HTMLInputElement).value = 'admin';
    const pwd = container.querySelector('#password') as HTMLInputElement;
    pwd.value = 'admin123';
    pwd.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
    await new Promise(r => setTimeout(r, 0));
    expect(spy).toHaveBeenCalled();
  });
});
