import request from 'supertest';
import app from '../src/server';
import { authHeader } from './helpers';

describe('Executor API', () => {
  describe('Permissions', () => {
    it('rejects without token', async () => {
      const res = await request(app).get('/api/executor/hazards');
      expect(res.status).toBe(401);
    });

    it('rejects supervisor role with 403', async () => {
      const res = await request(app)
        .get('/api/executor/hazards')
        .set(authHeader('supervisor', 4));
      expect(res.status).toBe(403);
    });

    it('allows executor and admin', async () => {
      const a = await request(app)
        .get('/api/executor/hazards')
        .set(authHeader('admin', 1));
      const e = await request(app)
        .get('/api/executor/hazards')
        .set(authHeader('executor', 2));
      expect(a.status).toBe(200);
      expect(e.status).toBe(200);
    });
  });

  describe('GET /api/executor/hazards', () => {
    it('returns paginated hazard list for the executor', async () => {
      const res = await request(app)
        .get('/api/executor/hazards?page=1&pageSize=10')
        .set(authHeader('executor', 2));
      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(10);
      expect(Array.isArray(res.body.list)).toBe(true);
      res.body.list.forEach((h: any) => {
        expect(h.executor_id).toBe(2);
      });
    });

    it('supports status filter', async () => {
      const res = await request(app)
        .get('/api/executor/hazards?status=pending')
        .set(authHeader('executor', 2));
      expect(res.status).toBe(200);
      res.body.list.forEach((h: any) => expect(h.status).toBe('pending'));
    });

    it('supports warningStatus filter', async () => {
      const res = await request(app)
        .get('/api/executor/hazards?warningStatus=normal')
        .set(authHeader('executor', 2));
      expect(res.status).toBe(200);
      res.body.list.forEach((h: any) => expect(h.warning_status).toBe('normal'));
    });
  });

  describe('POST /api/executor/hazards', () => {
    it('rejects when required fields missing', async () => {
      const res = await request(app)
        .post('/api/executor/hazards')
        .set(authHeader('executor', 2))
        .send({ description: 'only desc' });
      expect(res.status).toBe(400);
    });

    it('creates a new hazard with deadline', async () => {
      const res = await request(app)
        .post('/api/executor/hazards')
        .set(authHeader('executor', 2))
        .send({
          project_id: 1,
          floor_id: 1,
          area_id: 1,
          hazard_type_id: 6,
          group_id: 1,
          description: '新建测试隐患',
          deadline_date: '2099-12-31',
        });
      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
    });
  });

  describe('PUT /api/executor/hazards/:id/rectify', () => {
    let hazardId: number;
    beforeAll(async () => {
      const create = await request(app)
        .post('/api/executor/hazards')
        .set(authHeader('executor', 2))
        .send({
          project_id: 1,
          floor_id: 1,
          area_id: 1,
          hazard_type_id: 6,
          group_id: 1,
          description: '待整改隐患',
        });
      hazardId = create.body.id;
    });

    it('rejects without rectification_desc', async () => {
      const res = await request(app)
        .put(`/api/executor/hazards/${hazardId}/rectify`)
        .set(authHeader('executor', 2))
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent record', async () => {
      const res = await request(app)
        .put('/api/executor/hazards/9999999/rectify')
        .set(authHeader('executor', 2))
        .send({ rectification_desc: 'x' });
      expect(res.status).toBe(404);
    });

    it('returns 404 when rectifying another executor hazard', async () => {
      const res = await request(app)
        .put(`/api/executor/hazards/${hazardId}/rectify`)
        .set(authHeader('executor', 3))
        .send({ rectification_desc: '尝试越权' });
      expect(res.status).toBe(404);
    });

    it('rectifies the hazard successfully and changes status', async () => {
      const res = await request(app)
        .put(`/api/executor/hazards/${hazardId}/rectify`)
        .set(authHeader('executor', 2))
        .send({ rectification_desc: '已整改完成' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const list = await request(app)
        .get(`/api/executor/hazards?keyword=${encodeURIComponent('待整改隐患')}`)
        .set(authHeader('executor', 2));
      const item = list.body.list.find((x: any) => x.id === hazardId);
      expect(item).toBeDefined();
      expect(item.status).toBe('rectifying');
    });
  });

  describe('GET /api/executor/hazards/export', () => {
    it('returns xlsx blob', async () => {
      const res = await request(app)
        .get('/api/executor/hazards/export')
        .set(authHeader('executor', 2))
        .buffer(true);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheet');
    });
  });
});
