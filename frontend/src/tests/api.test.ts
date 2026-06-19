import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('API Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export authApi with login method', async () => {
    const { authApi } = await import('../services/api');
    expect(typeof authApi.login).toBe('function');
  });

  it('should export adminApi with required methods', async () => {
    const { adminApi } = await import('../services/api');
    expect(typeof adminApi.getProjects).toBe('function');
    expect(typeof adminApi.createProject).toBe('function');
    expect(typeof adminApi.updateProject).toBe('function');
    expect(typeof adminApi.deleteProject).toBe('function');
    expect(typeof adminApi.getFloors).toBe('function');
    expect(typeof adminApi.getAreas).toBe('function');
    expect(typeof adminApi.getHazardTypes).toBe('function');
    expect(typeof adminApi.getGroups).toBe('function');
    expect(typeof adminApi.getDeadlineRules).toBe('function');
  });

  it('should export executorApi with required methods', async () => {
    const { executorApi } = await import('../services/api');
    expect(typeof executorApi.getHazards).toBe('function');
    expect(typeof executorApi.createHazard).toBe('function');
    expect(typeof executorApi.rectifyHazard).toBe('function');
    expect(typeof executorApi.exportHazards).toBe('function');
  });

  it('should export supervisorApi with required methods', async () => {
    const { supervisorApi } = await import('../services/api');
    expect(typeof supervisorApi.getHazards).toBe('function');
    expect(typeof supervisorApi.reviewHazard).toBe('function');
  });

  it('should export commonApi with required methods', async () => {
    const { commonApi } = await import('../services/api');
    expect(typeof commonApi.getAllProjects).toBe('function');
    expect(typeof commonApi.getVirtualHazards).toBe('function');
    expect(typeof commonApi.exportHazards).toBe('function');
  });
});
