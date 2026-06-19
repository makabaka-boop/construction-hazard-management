import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi, adminApi, executorApi, supervisorApi, commonApi } from '../src/services/api';
import { mockUsers, mockProjects, mockHazards, createMockPageResult } from './mocks/data';

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';

describe('API 请求封装测试', () => {
  let fetchSpy: any;

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    fetchSpy = vi.spyOn(global, 'fetch');
    window.location.hash = '';
  });

  describe('request 函数', () => {
    it('应该在请求头中添加Authorization token', async () => {
      localStorage.setItem('token', mockToken);
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as any);

      await authApi.login('admin', 'admin123');

      expect(fetchSpy).toHaveBeenCalled();
      const callOptions = fetchSpy.mock.calls[0][1];
      expect(callOptions.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('请求成功应该正确解析JSON', async () => {
      const mockData = { token: mockToken, user: mockUsers.admin };
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as any);

      const result = await authApi.login('admin', 'admin123');
      expect(result).toEqual(mockData);
    });

    it('401错误应该清除token并跳转登录', async () => {
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUsers.admin));
      
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: '未授权' }),
      } as any);

      await expect(adminApi.getProjects()).rejects.toThrow('未授权');
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(window.location.hash).toBe('#/login');
    });

    it('其他HTTP错误应该抛出错误信息', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: '参数错误' }),
      } as any);

      await expect(adminApi.createProject({ name: '', code: '' })).rejects.toThrow('参数错误');
    });

    it('响应json解析失败应该使用默认错误信息', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('parse error')),
      } as any);

      await expect(adminApi.getProjects()).rejects.toThrow('请求失败');
    });

    it('export接口应该返回blob', async () => {
      localStorage.setItem('token', mockToken);
      const mockBlob = new Blob(['excel data']);
      fetchSpy.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as any);

      const result = await executorApi.exportHazards({});
      expect(result).toBe(mockBlob);
    });

    it('应该正确设置Content-Type', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as any);

      await authApi.login('admin', 'admin123');
      const callOptions = fetchSpy.mock.calls[0][1];
      expect(callOptions.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('authApi', () => {
    it('login应该发送正确的请求', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: mockToken, user: mockUsers.admin }),
      } as any);

      await authApi.login('admin', 'admin123');
      
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'admin', password: 'admin123' }),
        })
      );
    });
  });

  describe('adminApi', () => {
    beforeEach(() => {
      localStorage.setItem('token', mockToken);
    });

    it('getProjects应该发送分页和关键词参数', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockPageResult(mockProjects)),
      } as any);

      await adminApi.getProjects(1, 10, '测试');
      
      const url = fetchSpy.mock.calls[0][0];
      expect(url).toContain('page=1');
      expect(url).toContain('pageSize=10');
      expect(url).toContain('keyword=%E6%B5%8B%E8%AF%95');
    });

    it('createProject应该发送POST请求', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: '新项目', code: 'NEW' }),
      } as any);

      await adminApi.createProject({ name: '新项目', code: 'NEW' });
      
      expect(fetchSpy.mock.calls[0][1].method).toBe('POST');
    });

    it('deleteProject应该发送DELETE请求', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as any);

      await adminApi.deleteProject(1);
      
      expect(fetchSpy.mock.calls[0][1].method).toBe('DELETE');
    });
  });

  describe('executorApi', () => {
    beforeEach(() => {
      localStorage.setItem('token', mockToken);
    });

    it('getHazards应该使用URLSearchParams构建查询', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockPageResult(mockHazards)),
      } as any);

      await executorApi.getHazards({ status: 'pending', projectId: 1 });
      
      const url = fetchSpy.mock.calls[0][0];
      expect(url).toContain('status=pending');
      expect(url).toContain('projectId=1');
    });

    it('rectifyHazard应该发送PUT请求', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as any);

      await executorApi.rectifyHazard(1, { rectification_desc: '已整改' });
      
      expect(fetchSpy.mock.calls[0][1].method).toBe('PUT');
      expect(fetchSpy.mock.calls[0][0]).toContain('/executor/hazards/1/rectify');
    });
  });

  describe('supervisorApi', () => {
    beforeEach(() => {
      localStorage.setItem('token', mockToken);
    });

    it('reviewHazard应该发送复核数据', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as any);

      await supervisorApi.reviewHazard(1, { pass: true, review_comment: '合格' });
      
      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.pass).toBe(true);
      expect(body.review_comment).toBe('合格');
    });
  });

  describe('commonApi', () => {
    beforeEach(() => {
      localStorage.setItem('token', mockToken);
    });

    it('getAllProjects应该请求正确的URL', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProjects),
      } as any);

      await commonApi.getAllProjects();
      expect(fetchSpy.mock.calls[0][0]).toContain('/common/projects/all');
    });

    it('getVirtualHazards应该请求虚拟列表接口', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockPageResult(mockHazards)),
      } as any);

      await commonApi.getVirtualHazards({ page: 1, pageSize: 50 });
      expect(fetchSpy.mock.calls[0][0]).toContain('/common/hazards/virtual');
    });
  });
});
