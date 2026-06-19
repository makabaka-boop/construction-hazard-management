import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authApi, adminApi, executorApi, supervisorApi, commonApi } from '../src/services/api';

function mockFetchResponse(body: any, status = 200, ok = true) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
    blob: vi.fn().mockResolvedValue(new Blob([JSON.stringify(body)])),
  } as any;
}

describe('api request wrapper', () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('login posts JSON body and returns token+user', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockFetchResponse({ token: 'T', user: { id: 1, username: 'admin', role: 'admin', name: 'A' } }));
    vi.stubGlobal('fetch', fetchSpy);

    const result = await authApi.login('admin', 'admin123');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/auth/login');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ username: 'admin', password: 'admin123' });
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(result.token).toBe('T');
    expect(result.user.role).toBe('admin');
  });

  it('attaches Authorization header when token in localStorage', async () => {
    localStorage.setItem('token', 'fake-token');
    const fetchSpy = vi.fn().mockResolvedValue(mockFetchResponse({ list: [], total: 0, page: 1, pageSize: 20 }));
    vi.stubGlobal('fetch', fetchSpy);

    await adminApi.getProjects(1, 20, 'kw');
    const [, init] = fetchSpy.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer fake-token');
  });

  it('throws when response not ok and surfaces server error message', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockFetchResponse({ error: '权限不足' }, 403, false));
    vi.stubGlobal('fetch', fetchSpy);
    await expect(adminApi.getProjects()).rejects.toThrow('权限不足');
  });

  it('clears token and redirects on 401', async () => {
    localStorage.setItem('token', 'expired');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));
    const fetchSpy = vi.fn().mockResolvedValue(mockFetchResponse({ error: 'unauth' }, 401, false));
    vi.stubGlobal('fetch', fetchSpy);
    await expect(adminApi.getProjects()).rejects.toThrow();
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.hash).toBe('#/login');
  });

  it('returns blob for export endpoints', async () => {
    const blob = new Blob(['xx']);
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: vi.fn().mockResolvedValue(blob),
      json: vi.fn(),
    });
    vi.stubGlobal('fetch', fetchSpy);
    const result = await executorApi.exportHazards({});
    expect(result).toBe(blob);
  });
});

describe('adminApi URL composition', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse({ list: [], total: 0, page: 1, pageSize: 20 })));
  });

  it('encodes keyword in projects', async () => {
    await adminApi.getProjects(2, 50, '中文');
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toContain('page=2');
    expect(url).toContain('pageSize=50');
    expect(url).toContain('keyword=' + encodeURIComponent('中文'));
  });

  it('handles parentId null in hazard-types', async () => {
    await adminApi.getHazardTypes(null);
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toContain('parentId=null');
  });

  it('builds floors with projectId filter', async () => {
    await adminApi.getFloors(7, 1, 10, 'k');
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toContain('projectId=7');
  });
});

describe('executorApi.getHazards filter params', () => {
  it('serializes filter params and pagination, dropping undefined / empty', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockFetchResponse({ list: [], total: 0, page: 1, pageSize: 20 }));
    vi.stubGlobal('fetch', fetchSpy);

    await executorApi.getHazards({
      page: 1,
      pageSize: 20,
      status: 'pending',
      projectId: 3,
      keyword: '',
      groupId: undefined,
    });

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain('status=pending');
    expect(url).toContain('projectId=3');
    expect(url).not.toContain('groupId=');
    expect(url).not.toContain('keyword=');
  });
});

describe('supervisorApi.reviewHazard', () => {
  it('sends pass + review_comment as PUT JSON', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockFetchResponse({ success: true }));
    vi.stubGlobal('fetch', fetchSpy);
    await supervisorApi.reviewHazard(42, { pass: true, review_comment: 'ok' });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/supervisor/hazards/42/review');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ pass: true, review_comment: 'ok' });
  });
});

describe('commonApi cascading endpoints', () => {
  it('getAllFloors uses projectId', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockFetchResponse([]));
    vi.stubGlobal('fetch', fetchSpy);
    await commonApi.getAllFloors(5, '');
    expect(fetchSpy.mock.calls[0][0]).toContain('projectId=5');
  });

  it('getAllHazardTypes with null parentId', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockFetchResponse([]));
    vi.stubGlobal('fetch', fetchSpy);
    await commonApi.getAllHazardTypes(null);
    expect(fetchSpy.mock.calls[0][0]).toContain('parentId=null');
  });

  it('getAllHazardTypes with id parentId', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockFetchResponse([]));
    vi.stubGlobal('fetch', fetchSpy);
    await commonApi.getAllHazardTypes(11);
    expect(fetchSpy.mock.calls[0][0]).toContain('parentId=11');
  });
});
