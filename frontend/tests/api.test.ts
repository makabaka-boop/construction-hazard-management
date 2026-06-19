import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authApi, adminApi, executorApi, supervisorApi, commonApi } from '../src/services/api';
import { mockUsers, mockProjects, mockHazards, mockFetch, mockFetchError } from './mocks';

describe('API请求封装测试', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  describe('request基础功能', () => {
    it('应该在请求头中携带token', async () => {
      const token = 'test-token-123';
      localStorage.setItem('token', token);
      mockFetch({ success: true });

      await authApi.login('admin', 'admin123');

      const calls = (global.fetch as any).mock.calls;
      const headers = calls[0][1].headers;
      expect(headers['Authorization']).toBe(`Bearer ${token}`);
    });

    it('没有token时不应该携带Authorization头', async () => {
      mockFetch({ success: true });

      await authApi.login('admin', 'admin123');

      const calls = (global.fetch as any).mock.calls;
      const headers = calls[0][1].headers;
      expect(headers['Authorization']).toBeUndefined();
    });

    it('401时应该清除token并跳转登录页', async () => {
      localStorage.setItem('token', 'old-token');
      localStorage.setItem('user', JSON.stringify(mockUsers.admin));
      mockFetchError('未授权', 401);

      await expect(authApi.login('admin', 'admin123')).rejects.toThrow('未授权');

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(window.location.hash).toBe('#/login');
    });

    it('请求失败应该抛出错误', async () => {
      mockFetchError('服务器错误', 500);

      await expect(authApi.login('admin', 'admin123')).rejects.toThrow('服务器错误');
    });
  });

  describe('authApi', () => {
    it('login应该发送POST请求到正确地址', async () => {
      mockFetch({ token: 'token123', user: mockUsers.admin });

      const result = await authApi.login('admin', 'admin123');

      const calls = (global.fetch as any).mock.calls;
      expect(calls[0][0]).toBe('/api/auth/login');
      expect(calls[0][1].method).toBe('POST');
      expect(JSON.parse(calls[0][1].body)).toEqual({ username: 'admin', password: 'admin123' });
      expect(result.token).toBe('token123');
      expect(result.user).toEqual(mockUsers.admin);
    });
  });

  describe('adminApi', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'admin-token');
    });

    it('getProjects应该发送正确的分页请求', async () => {
      mockFetch({ list: mockProjects, total: 2, page: 1, pageSize: 20 });

      await adminApi.getProjects(1, 20, '');

      const calls = (global.fetch as any).mock.calls;
      expect(calls[0][0]).toContain('/api/admin/projects');
      expect(calls[0][0]).toContain('page=1');
      expect(calls[0][0]).toContain('pageSize=20');
    });

    it('createProject应该发送POST请求', async () => {
      const newProject = { name: '新项目', code: 'NEW001' };
      mockFetch({ id: 3, ...newProject });

      await adminApi.createProject(newProject);

      const calls = (global.fetch as any).mock.calls;
      expect(calls[0][1].method).toBe('POST');
      expect(JSON.parse(calls[0][1].body)).toEqual(newProject);
    });

    it('updateProject应该发送PUT请求', async () => {
      mockFetch({ success: true });

      await adminApi.updateProject(1, { name: '更新项目' });

      const calls = (global.fetch as any).mock.calls;
      expect(calls[0][0]).toContain('/api/admin/projects/1');
      expect(calls[0][1].method).toBe('PUT');
    });

    it('deleteProject应该发送DELETE请求', async () => {
      mockFetch({ success: true });

      await adminApi.deleteProject(1);

      const calls = (global.fetch as any).mock.calls;
      expect(calls[0][0]).toContain('/api/admin/projects/1');
      expect(calls[0][1].method).toBe('DELETE');
    });
  });

  describe('executorApi', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'executor-token');
    });

    it('getHazards应该构建正确的查询参数', async () => {
      mockFetch({ list: mockHazards, total: 2, page: 1, pageSize: 20 });

      await executorApi.getHazards({ status: 'pending', projectId: 1 });

      const calls = (global.fetch as any).mock.calls;
      expect(calls[0][0]).toContain('/api/executor/hazards');
      expect(calls[0][0]).toContain('status=pending');
      expect(calls[0][0]).toContain('projectId=1');
    });

    it('createHazard应该发送POST请求', async () => {
      const newHazard = {
        project_id: 1,
        floor_id: 1,
        area_id: 1,
        hazard_type_id: 2,
        group_id: 1,
        description: '新隐患',
      };
      mockFetch({ id: 100 });

      await executorApi.createHazard(newHazard);

      const calls = (global.fetch as any).mock.calls;
      expect(calls[0][1].method).toBe('POST');
      expect(JSON.parse(calls[0][1].body)).toMatchObject(newHazard);
    });

    it('rectifyHazard应该发送整改请求', async () => {
      mockFetch({ success: true });

      await executorApi.rectifyHazard(1, { rectification_desc: '已整改' });

      const calls = (global.fetch as any).mock.calls;
      expect(calls[0][0]).toContain('/api/executor/hazards/1/rectify');
      expect(calls[0][1].method).toBe('PUT');
      expect(JSON.parse(calls[0][1].body)).toEqual({ rectification_desc: '已整改' });
    });
  });

  describe('supervisorApi', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'supervisor-token');
    });

    it('reviewHazard应该发送复核请求', async () => {
      mockFetch({ success: true });

      await supervisorApi.reviewHazard(1, { pass: true, review_comment: '通过' });

      const calls = (global.fetch as any).mock.calls;
      expect(calls[0][0]).toContain('/api/supervisor/hazards/1/review');
      expect(calls[0][1].method).toBe('PUT');
      expect(JSON.parse(calls[0][1].body)).toEqual({ pass: true, review_comment: '通过' });
    });
  });

  describe('commonApi', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'user-token');
    });

    it('getAllProjects应该获取项目列表', async () => {
      mockFetch(mockProjects);

      const result = await commonApi.getAllProjects();

      const calls = (global.fetch as any).mock.calls;
      expect(calls[0][0]).toContain('/api/common/projects/all');
      expect(result).toEqual(mockProjects);
    });

    it('getVirtualHazards应该获取虚拟列表分页数据', async () => {
      mockFetch({ list: mockHazards, total: 2, page: 1, pageSize: 50 });

      await commonApi.getVirtualHazards({ page: 1, pageSize: 50 });

      const calls = (global.fetch as any).mock.calls;
      expect(calls[0][0]).toContain('/api/common/hazards/virtual');
    });

    it('exportHazards应该返回Blob', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        blob: () => Promise.resolve(new Blob(['test'], { type: 'application/octet-stream' })),
      } as any);

      const result = await commonApi.exportHazards({});
      expect(result).toBeInstanceOf(Blob);
    });
  });
});
