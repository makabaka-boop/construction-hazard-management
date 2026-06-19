import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Page Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('LoginPage', () => {
    it('should render login form with correct elements', async () => {
      const { LoginPage } = await import('../pages/LoginPage');
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      new LoginPage(container);

      expect(container.querySelector('h2')?.textContent).toBe('施工隐患管理系统');
      expect(container.querySelector('input#username')).not.toBeNull();
      expect(container.querySelector('input#password')).not.toBeNull();
      expect(container.querySelector('button#loginBtn')).not.toBeNull();
    });

    it('should have input fields with correct placeholders', async () => {
      const { LoginPage } = await import('../pages/LoginPage');
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      new LoginPage(container);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      
      expect(usernameInput.placeholder).toBe('请输入用户名');
      expect(passwordInput.placeholder).toBe('请输入密码');
    });

    it('should render test account hints', async () => {
      const { LoginPage } = await import('../pages/LoginPage');
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      new LoginPage(container);

      expect(container.textContent).toContain('管理员：admin / admin123');
      expect(container.textContent).toContain('执行人：executor / exec123');
      expect(container.textContent).toContain('监督人：supervisor / super123');
    });
  });
});
