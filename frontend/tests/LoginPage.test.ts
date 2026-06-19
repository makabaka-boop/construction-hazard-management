import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginPage } from '../src/pages/LoginPage';
import { mockUsers, mockFetch, mockFetchError } from './mocks';

describe('登录页面测试', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    localStorage.clear();
    vi.resetAllMocks();
  });

  afterEach(() => {
    container.remove();
  });

  it('应该渲染登录表单', () => {
    new LoginPage(container);

    expect(container.querySelector('h2')?.textContent).toBe('施工隐患管理系统');
    expect(container.querySelector('#username')).not.toBeNull();
    expect(container.querySelector('#password')).not.toBeNull();
    expect(container.querySelector('#loginBtn')).not.toBeNull();
  });

  it('用户名和密码为空时应该显示错误提示', async () => {
    new LoginPage(container);
    const showToastSpy = vi.spyOn(await import('../src/utils'), 'showToast');

    const loginBtn = container.querySelector('#loginBtn') as HTMLButtonElement;
    loginBtn.click();

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(showToastSpy).toHaveBeenCalledWith('请输入用户名和密码', 'error');
  });

  it('只有用户名时应该显示错误提示', async () => {
    new LoginPage(container);
    const showToastSpy = vi.spyOn(await import('../src/utils'), 'showToast');

    const usernameInput = container.querySelector('#username') as HTMLInputElement;
    usernameInput.value = 'admin';
    const loginBtn = container.querySelector('#loginBtn') as HTMLButtonElement;
    loginBtn.click();

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(showToastSpy).toHaveBeenCalledWith('请输入用户名和密码', 'error');
  });

  it('登录成功应该保存token和用户信息', async () => {
    mockFetch({ token: 'test-token', user: mockUsers.admin });
    new LoginPage(container);

    const usernameInput = container.querySelector('#username') as HTMLInputElement;
    const passwordInput = container.querySelector('#password') as HTMLInputElement;
    usernameInput.value = 'admin';
    passwordInput.value = 'admin123';

    const loginBtn = container.querySelector('#loginBtn') as HTMLButtonElement;
    loginBtn.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(localStorage.getItem('token')).toBe('test-token');
    expect(JSON.parse(localStorage.getItem('user') || '{}')).toEqual(mockUsers.admin);
  });

  it('管理员登录成功应该跳转到admin页面', async () => {
    mockFetch({ token: 'admin-token', user: mockUsers.admin });
    new LoginPage(container);

    const usernameInput = container.querySelector('#username') as HTMLInputElement;
    const passwordInput = container.querySelector('#password') as HTMLInputElement;
    usernameInput.value = 'admin';
    passwordInput.value = 'admin123';

    const loginBtn = container.querySelector('#loginBtn') as HTMLButtonElement;
    loginBtn.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(window.location.hash).toBe('#/admin');
  });

  it('执行人登录成功应该跳转到executor页面', async () => {
    mockFetch({ token: 'exec-token', user: mockUsers.executor });
    new LoginPage(container);

    const usernameInput = container.querySelector('#username') as HTMLInputElement;
    const passwordInput = container.querySelector('#password') as HTMLInputElement;
    usernameInput.value = 'executor';
    passwordInput.value = 'exec123';

    const loginBtn = container.querySelector('#loginBtn') as HTMLButtonElement;
    loginBtn.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(window.location.hash).toBe('#/executor');
  });

  it('监督员登录成功应该跳转到supervisor页面', async () => {
    mockFetch({ token: 'super-token', user: mockUsers.supervisor });
    new LoginPage(container);

    const usernameInput = container.querySelector('#username') as HTMLInputElement;
    const passwordInput = container.querySelector('#password') as HTMLInputElement;
    usernameInput.value = 'supervisor';
    passwordInput.value = 'super123';

    const loginBtn = container.querySelector('#loginBtn') as HTMLButtonElement;
    loginBtn.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(window.location.hash).toBe('#/supervisor');
  });

  it('登录失败应该显示错误提示', async () => {
    mockFetchError('用户名或密码错误', 401);
    new LoginPage(container);
    const showToastSpy = vi.spyOn(await import('../src/utils'), 'showToast');

    const usernameInput = container.querySelector('#username') as HTMLInputElement;
    const passwordInput = container.querySelector('#password') as HTMLInputElement;
    usernameInput.value = 'admin';
    passwordInput.value = 'wrong';

    const loginBtn = container.querySelector('#loginBtn') as HTMLButtonElement;
    loginBtn.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(showToastSpy).toHaveBeenCalledWith('用户名或密码错误', 'error');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
