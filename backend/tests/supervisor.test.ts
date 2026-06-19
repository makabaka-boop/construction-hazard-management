import request from 'supertest';
import app from '../src/server';
import { authHeader } from './helpers';

describe('Supervisor API', () => {
  describe('Permissions', () => {
    it('rejects without token', async () => {
      const res = await request(app).get('/api/supervisor/hazards');
      expect(res.status).toBe(401);
    });

    it('rejects executor role with 403', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards')
        .set(authHeader('executor', 2));
      expect(res.status).toBe(403);
    });

    it('allows supervisor and admin', async () => {
      const s = await request(app)
        .get('/api/supervisor/hazards')
        .set(authHeader('supervisor', 4));
      const a = await request(app)
        .get('/api/supervisor/hazards')
        .set(authHeader('admin', 1));
      expect(s.status).toBe(200);
      expect(a.status).toBe(200);
    });
  });

  describe('GET /api/supervisor/hazards', () => {
    it('returns paginated list with filters', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards?page=1&pageSize=5')
        .set(authHeader('supervisor', 4));
      expect(res.status).toBe(200);
      expect(res.body.list.length).toBeLessThanOrEqual(5);
    });

    it('filters by status', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards?status=rectifying')
        .set(authHeader('supervisor', 4));
      expect(res.status).toBe(200);
      res.body.list.forEach((h: any) => expect(h.status).toBe('rectifying'));
    });

    it('filters by projectId', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards?projectId=1')
        .set(authHeader('supervisor', 4));
      expect(res.status).toBe(200);
      res.body.list.forEach((h: any) => expect(h.project_id).toBe(1));
    });
  });

  describe('PUT /api/supervisor/hazards/:id/review', () => {
    it('returns 404 for missing record', async () => {
      const res = await request(app)
        .put('/api/supervisor/hazards/999999/review')
        .set(authHeader('supervisor', 4))
        .send({ pass: true, review_comment: '通过' });
      expect(res.status).toBe(404);
    });

    it('passing review closes the hazard', async () => {
      const create = await request(app)
        .post('/api/executor/hazards')
        .set(authHeader('executor', 2))
        .send({
          project_id: 1,
          floor_id: 1,
          area_id: 1,
          hazard_type_id: 6,
          group_id: 1,
          description: '复核通过测试',
        });
      const hazardId = create.body.id;
      await request(app)
        .put(`/api/executor/hazards/${hazardId}/rectify`)
        .set(authHeader('executor', 2))
        .send({ rectification_desc: '已整改' });

      const res = await request(app)
        .put(`/api/supervisor/hazards/${hazardId}/review`)
        .set(authHeader('supervisor', 4))
        .send({ pass: true, review_comment: '复核通过' });
      expect(res.status).toBe(200);

      const list = await request(app)
        .get(`/api/supervisor/hazards?keyword=${encodeURIComponent('复核通过测试')}`)
        .set(authHeader('supervisor', 4));
      const found = list.body.list.find((h: any) => h.id === hazardId);
      expect(found.status).toBe('closed');
      expect(found.supervisor_id).toBe(4);
    });

    it('rejecting review puts hazard back to pending', async () => {
      const create = await request(app)
        .post('/api/executor/hazards')
        .set(authHeader('executor', 2))
        .send({
          project_id: 1,
          floor_id: 1,
          area_id: 1,
          hazard_type_id: 6,
          group_id: 1,
          description: '复核打回测试',
        });
      const hazardId = create.body.id;
      await request(app)
        .put(`/api/executor/hazards/${hazardId}/rectify`)
        .set(authHeader('executor', 2))
        .send({ rectification_desc: '已整改' });

      const res = await request(app)
        .put(`/api/supervisor/hazards/${hazardId}/review`)
        .set(authHeader('supervisor', 4))
        .send({ pass: false, review_comment: '不合格' });
      expect(res.status).toBe(200);

      const list = await request(app)
        .get(`/api/supervisor/hazards?keyword=${encodeURIComponent('复核打回测试')}`)
        .set(authHeader('supervisor', 4));
      const found = list.body.list.find((h: any) => h.id === hazardId);
      expect(found.status).toBe('pending');
    });
  });
});
