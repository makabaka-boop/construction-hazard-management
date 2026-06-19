import request from 'supertest';
import app from '../src/server';
import { authHeader } from './helpers';

describe('Admin API - Projects', () => {
  it('rejects request without token', async () => {
    const res = await request(app).get('/api/admin/projects');
    expect(res.status).toBe(401);
  });

  it('rejects executor role with 403', async () => {
    const res = await request(app)
      .get('/api/admin/projects')
      .set(authHeader('executor', 2));
    expect(res.status).toBe(403);
  });

  it('rejects supervisor role with 403', async () => {
    const res = await request(app)
      .get('/api/admin/projects')
      .set(authHeader('supervisor', 4));
    expect(res.status).toBe(403);
  });

  it('lists projects with pagination', async () => {
    const res = await request(app)
      .get('/api/admin/projects')
      .set(authHeader('admin', 1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.list)).toBe(true);
    expect(typeof res.body.total).toBe('number');
    expect(res.body.page).toBe(1);
  });

  it('rejects creating project with missing fields', async () => {
    const res = await request(app)
      .post('/api/admin/projects')
      .set(authHeader('admin', 1))
      .send({});
    expect(res.status).toBe(400);
  });

  it('creates / updates / deletes a project', async () => {
    const create = await request(app)
      .post('/api/admin/projects')
      .set(authHeader('admin', 1))
      .send({ name: '测试项目X', code: 'TX001' });
    expect(create.status).toBe(200);
    const id = create.body.id;

    const dup = await request(app)
      .post('/api/admin/projects')
      .set(authHeader('admin', 1))
      .send({ name: '测试项目X', code: 'TX001' });
    expect(dup.status).toBe(400);

    const upd = await request(app)
      .put(`/api/admin/projects/${id}`)
      .set(authHeader('admin', 1))
      .send({ name: '测试项目X-改', code: 'TX001' });
    expect(upd.status).toBe(200);

    const del = await request(app)
      .delete(`/api/admin/projects/${id}`)
      .set(authHeader('admin', 1));
    expect(del.status).toBe(200);
  });

  it('supports keyword filtering', async () => {
    await request(app)
      .post('/api/admin/projects')
      .set(authHeader('admin', 1))
      .send({ name: '关键词项目', code: 'KW777' });
    const res = await request(app)
      .get('/api/admin/projects?keyword=KW777')
      .set(authHeader('admin', 1));
    expect(res.status).toBe(200);
    expect(res.body.list.some((p: any) => p.code === 'KW777')).toBe(true);
  });
});

describe('Admin API - Floors / Areas', () => {
  let projectId: number;

  beforeAll(async () => {
    const create = await request(app)
      .post('/api/admin/projects')
      .set(authHeader('admin', 1))
      .send({ name: '楼层测试项目', code: 'FT001' });
    projectId = create.body.id;
  });

  it('creates a floor and lists floors by project', async () => {
    const create = await request(app)
      .post('/api/admin/floors')
      .set(authHeader('admin', 1))
      .send({ project_id: projectId, name: '1层', code: 'F01' });
    expect(create.status).toBe(200);

    const list = await request(app)
      .get(`/api/admin/floors?projectId=${projectId}`)
      .set(authHeader('admin', 1));
    expect(list.status).toBe(200);
    expect(list.body.list.length).toBeGreaterThan(0);
  });

  it('rejects duplicate floor code per project', async () => {
    await request(app)
      .post('/api/admin/floors')
      .set(authHeader('admin', 1))
      .send({ project_id: projectId, name: '2层', code: 'F02' });
    const dup = await request(app)
      .post('/api/admin/floors')
      .set(authHeader('admin', 1))
      .send({ project_id: projectId, name: '2层B', code: 'F02' });
    expect(dup.status).toBe(400);
  });

  it('creates an area under a floor', async () => {
    const floor = await request(app)
      .post('/api/admin/floors')
      .set(authHeader('admin', 1))
      .send({ project_id: projectId, name: '3层', code: 'F03' });
    const area = await request(app)
      .post('/api/admin/areas')
      .set(authHeader('admin', 1))
      .send({ floor_id: floor.body.id, name: '东区', code: 'A01' });
    expect(area.status).toBe(200);

    const list = await request(app)
      .get(`/api/admin/areas?floorId=${floor.body.id}`)
      .set(authHeader('admin', 1));
    expect(list.body.list.length).toBeGreaterThan(0);
  });
});

describe('Admin API - Hazard Types', () => {
  it('lists root hazard types', async () => {
    const res = await request(app)
      .get('/api/admin/hazard-types?parentId=null')
      .set(authHeader('admin', 1));
    expect(res.status).toBe(200);
    expect(res.body.list.every((t: any) => t.parent_id === null)).toBe(true);
  });

  it('creates a sub hazard type', async () => {
    const root = await request(app)
      .post('/api/admin/hazard-types')
      .set(authHeader('admin', 1))
      .send({ name: '测试大类', code: 'HTT01' });
    const sub = await request(app)
      .post('/api/admin/hazard-types')
      .set(authHeader('admin', 1))
      .send({ parent_id: root.body.id, name: '测试子类', code: 'HTT01-1' });
    expect(sub.status).toBe(200);
    expect(sub.body.parent_id).toBe(root.body.id);
  });
});

describe('Admin API - Groups', () => {
  it('creates a group and lists with keyword', async () => {
    const create = await request(app)
      .post('/api/admin/groups')
      .set(authHeader('admin', 1))
      .send({ name: '测试组A', leader: '组长', phone: '13900000000' });
    expect(create.status).toBe(200);

    const list = await request(app)
      .get('/api/admin/groups?keyword=' + encodeURIComponent('测试组A'))
      .set(authHeader('admin', 1));
    expect(list.status).toBe(200);
    expect(list.body.list.length).toBeGreaterThan(0);
  });
});

describe('Admin API - Deadline Rules', () => {
  it('rejects creating rule without required fields', async () => {
    const res = await request(app)
      .post('/api/admin/deadline-rules')
      .set(authHeader('admin', 1))
      .send({});
    expect(res.status).toBe(400);
  });

  it('rejects update without default_days', async () => {
    const list = await request(app)
      .get('/api/admin/deadline-rules')
      .set(authHeader('admin', 1));
    const rule = list.body.list[0];
    if (rule) {
      const res = await request(app)
        .put(`/api/admin/deadline-rules/${rule.id}`)
        .set(authHeader('admin', 1))
        .send({});
      expect(res.status).toBe(400);
    }
  });

  it('lists deadline rules', async () => {
    const res = await request(app)
      .get('/api/admin/deadline-rules')
      .set(authHeader('admin', 1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.list)).toBe(true);
  });
});
