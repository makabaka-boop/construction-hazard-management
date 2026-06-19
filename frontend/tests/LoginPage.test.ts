import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { LoginPage } from '../src/pages/LoginPage';
import { authApi } from '../src/services/api';
import { mockUsers } from './mocks/data';
import { createContainer, cleanupContainer, mockFetchResponse } from './setup';

vi.mock('../src/services/api', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

const mockShowToast = vi.fn();
vi.mock('../src/utils', () => ({
  showToast: (...args: any[]) => mockShowToast(...args),
}));

describe('登录页测试', () => {
  let container: HTMLElement;
  let page: LoginPage;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    container = createContainer();
    page = new LoginPage(container);
  });

  afterEach(() => {
    cleanupContainer(container);
  });

  it('应该正确渲染登录表单', () => {
    expect(container.querySelector('h2')?.textContent).toBe('施工隐患管理系统');
    expect(container.querySelector('#username')).toBeInTheDocument();
    expect(container.querySelector('#password')).toBeInTheDocument();
    expect(container.querySelector('#loginBtn')).toBeInTheDocument();
  });

  it('应该显示测试账号提示', () => {
    expect(container.textContent).toContain('管理员：admin / admin123');
    expect(container.textContent).toContain('执行人：executor / exec123');
    expect(container.textContent).toContain('监督人：supervisor / super123');
  });

  it('用户名或密码为空时应该提示错误', async () => {
    const loginBtn = container.querySelector('#loginBtn') as HTMLButtonElement;
    fireEvent.click(loginBtn);
    
    expect(mockShowToast).toHaveBeenCalledWith('请输入用户名和密码', 'error');
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('只输入用户名不输入密码应该提示错误', async () => {
    const usernameInput = container.querySelector('#username') as HTMLInputElement;
    const loginBtn = container.querySelector('#loginBtn') as HTMLButtonElement;
    
    fireEvent.input(usernameInput, { target: { value: 'admin' } });
    fireEvent.click(loginBtn);
    
    expect(mockShowToast).toHaveBeenCalledWith('请输入用户名和密码', 'error');
  });

  it('登录成功后应该保存token和user信息到localStorage并跳转管理员页面', async () => {
    (authApi.login as any).mockResolvedValue({
      token: 'test-token',
      user: mockUsers.admin,
    });

    const usernameInput = container.querySelector('#username') as HTMLInputElement;
    const passwordInput = container.querySelector('#password') as HTMLInputElement;
    const loginBtn = container.querySelector('#loginBtn') as HTMLButtonElement;
    
    fireEvent.input(usernameInput, { target: { value: 'admin' } });
    fireEvent.input(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(loginBtn);
    
    await vi.waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('admin', 'admin123');
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUsers.admin));
      expect(window.location.hash).toBe('#/admin');
    });
  });

  it('执行人登录成功后应该跳转到执行人页面', async () => {
    (authApi.login as any).mockResolvedValue({
      token: 'test-token',
      user: mockUsers.executor,
    });

    const usernameInput = container.querySelector('#username') as HTMLInputElement;
    const passwordInput = container.querySelector('#password') as HTMLInputElement;
    const loginBtn = container.querySelector('#loginBtn') as HTMLButtonElement;
    
    fireEvent.input(usernameInput, { target: { value: 'executor' } });
    fireEvent.input(passwordInput, { target: { value: 'exec123' } });
    fireEvent.click(loginBtn);
    
    await vi.waitFor(() => {
      expect(window.location.hash).toBe('#/executor');
    });
  });

  it('监督员登录成功后应该跳转到监督员页面', async () => {
    (authApi.login as any).mockResolvedValue({
      token: 'test-token',
      user: mockUsers.supervisor,
    });

    const usernameInput = container.querySelector('#username') as HTMLInputElement;
    const passwordInput = container.querySelector('#password') as HTMLInputElement;
    const loginBtn = container.querySelector('#loginBtn') as HTMLButtonElement;
    
    fireEvent.input(usernameInput, { target: { value: 'supervisor' } });
    fireEvent.input(passwordInput, { target: { value: 'super123' } });
    fireEvent.click(loginBtn);
    
    await vi.waitFor(() => {
      expect(window.location.hash).toBe('#/supervisor');
    });
  });

  it('登录失败应该显示错误提示', async () => {
    (authApi.login as any).mockRejectedValue(new Error('用户名或密码错误'));

    const usernameInput = container.querySelector('#username') as HTMLInputElement;
    const passwordInput = container.querySelector('#password') as HTMLInputElement;
    const loginBtn = container.querySelector('#loginBtn') as HTMLButtonElement;
    
    fireEvent.input(usernameInput, { target: { value: 'wrong' } });
    fireEvent.input(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(loginBtn);
    
    await vi.waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('用户名或密码错误', 'error');
    });
  });

  it('在密码框按回车应该触发登录', async () => {
    (authApi.login as any).mockResolvedValue({
      token: 'test-token',
      user: mockUsers.admin,
    });

    const usernameInput = container.querySelector('#username') as HTMLInputElement;
    const passwordInput = container.querySelector('#password') as HTMLInputElement;
    
    fireEvent.input(usernameInput, { target: { value: 'admin' } });
    fireEvent.input(passwordInput, { target: { value: 'admin123' } });
    fireEvent.keyPress(passwordInput, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    await vi.waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('admin', 'admin123');
    });
  });

  it('登录成功应该显示成功提示', async () => {
    (authApi.login as any).mockResolvedValue({
      token: 'test-token',
      user: mockUsers.admin,
    });

    const usernameInput = container.querySelector('#username') as HTMLInputElement;
    const passwordInput = container.querySelector('#password') as HTMLInputElement;
    const loginBtn = container.querySelector('#loginBtn') as HTMLButtonElement;
    
    fireEvent.input(usernameInput, { target: { value: 'admin' } });
    fireEvent.input(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(loginBtn);
    
    await vi.waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('登录成功');
    });
  });
});
