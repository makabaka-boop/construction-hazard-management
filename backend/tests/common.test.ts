import request from 'supertest';
import app from '../src/server';
import { authHeader } from './helpers';

describe('Common API', () => {
  it('rejects without token', async () => {
    const res = await request(app).get('/api/common/projects/all');
    expect(res.status).toBe(401);
  });

  it('returns all projects', async () => {
    const res = await request(app)
      .get('/api/common/projects/all')
      .set(authHeader('executor', 2));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns floors filtered by projectId', async () => {
    const res = await request(app)
      .get('/api/common/floors/all?projectId=1')
      .set(authHeader('executor', 2));
    expect(res.status).toBe(200);
    res.body.forEach((f: any) => expect(f.project_id).toBe(1));
  });

  it('returns areas filtered by floorId', async () => {
    const res = await request(app)
      .get('/api/common/areas/all?floorId=1')
      .set(authHeader('executor', 2));
    expect(res.status).toBe(200);
    res.body.forEach((a: any) => expect(a.floor_id).toBe(1));
  });

  it('returns root hazard types when parentId not given', async () => {
    const res = await request(app)
      .get('/api/common/hazard-types/all')
      .set(authHeader('executor', 2));
    expect(res.status).toBe(200);
    res.body.forEach((t: any) => expect(t.parent_id).toBeNull());
  });

  it('returns sub hazard types by parentId', async () => {
    const roots = await request(app)
      .get('/api/common/hazard-types/all')
      .set(authHeader('executor', 2));
    const parent = roots.body[0];
    if (parent) {
      const res = await request(app)
        .get(`/api/common/hazard-types/all?parentId=${parent.id}`)
        .set(authHeader('executor', 2));
      expect(res.status).toBe(200);
      res.body.forEach((t: any) => expect(t.parent_id).toBe(parent.id));
    }
  });

  it('returns groups list', async () => {
    const res = await request(app)
      .get('/api/common/groups/all')
      .set(authHeader('executor', 2));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns deadline rules', async () => {
    const res = await request(app)
      .get('/api/common/deadline-rules/all')
      .set(authHeader('executor', 2));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns virtual hazards with pagination', async () => {
    const res = await request(app)
      .get('/api/common/hazards/virtual?page=1&pageSize=20')
      .set(authHeader('admin', 1));
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(Array.isArray(res.body.list)).toBe(true);
    expect(res.body.list.length).toBeLessThanOrEqual(20);
  });

  it('virtual hazards supports keyword filter', async () => {
    const res = await request(app)
      .get('/api/common/hazards/virtual?keyword=' + encodeURIComponent('隐患记录'))
      .set(authHeader('admin', 1));
    expect(res.status).toBe(200);
  });

  it('exports hazards xlsx', async () => {
    const res = await request(app)
      .get('/api/common/hazards/export')
      .set(authHeader('admin', 1))
      .buffer(true);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheet');
  });
});
