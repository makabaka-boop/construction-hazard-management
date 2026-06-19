process.env.NODE_ENV = 'test';

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { setupTestEnv, teardownTestEnv, generateToken } from './testHelper';

describe('Supervisor API Tests', () => {
  let db: any;
  let app: express.Express;
  let adminToken: string;
  let executorToken: string;
  let supervisorToken: string;
  let users: any;
  let basic: any;

  beforeEach(() => {
    const env = setupTestEnv();
    db = env.db;
    users = env.users;
    basic = env.basic;

    adminToken = generateToken(users.admin.id, users.admin.username, users.admin.role);
    executorToken = generateToken(users.executor.id, users.executor.username, users.executor.role);
    supervisorToken = generateToken(users.supervisor.id, users.supervisor.username, users.supervisor.role);

    app = express();
    app.use(cors());
    app.use(express.json());

    const supervisorRouter = require('../src/routes/supervisor').default;
    const executorRouter = require('../src/routes/executor').default;
    app.use('/api/supervisor', supervisorRouter);
    app.use('/api/executor', executorRouter);
  });

  afterEach(() => {
    teardownTestEnv(db);
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/supervisor/hazards');
      expect(res.status).toBe(401);
    });

    it('should return 403 when executor accesses supervisor routes', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards')
        .set('Authorization', `Bearer ${executorToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow supervisor access', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res.status).toBe(200);
    });

    it('should allow admin access to supervisor routes', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Hazard Review', () => {
    let hazardId: number;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/executor/hazards')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          project_id: basic.projectId,
          floor_id: basic.floorId,
          area_id: basic.areaId,
          hazard_type_id: basic.hazardTypeId,
          group_id: basic.groupId,
          description: '待审核隐患',
        });
      hazardId = createRes.body.id;

      await request(app)
        .put(`/api/executor/hazards/${hazardId}/rectify`)
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          rectification_desc: '整改完成',
        });
    });

    it('should get all hazards list', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards')
        .set('Authorization', `Bearer ${supervisorToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.list)).toBe(true);
    });

    it('should approve a hazard review (pass=true)', async () => {
      const res = await request(app)
        .put(`/api/supervisor/hazards/${hazardId}/review`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          review_comment: '整改合格',
          pass: true,
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const getRes = await request(app)
        .get('/api/supervisor/hazards')
        .set('Authorization', `Bearer ${supervisorToken}`);
      
      const closedHazard = getRes.body.list.find((h: any) => h.id === hazardId);
      expect(closedHazard).toBeDefined();
      expect(closedHazard.status).toBe('closed');
    });

    it('should reject a hazard review (pass=false)', async () => {
      const res = await request(app)
        .put(`/api/supervisor/hazards/${hazardId}/review`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          review_comment: '整改不合格，请重新整改',
          pass: false,
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const getRes = await request(app)
        .get('/api/supervisor/hazards')
        .set('Authorization', `Bearer ${supervisorToken}`);
      
      const pendingHazard = getRes.body.list.find((h: any) => h.id === hazardId);
      expect(pendingHazard).toBeDefined();
      expect(pendingHazard.status).toBe('pending');
    });

    it('should return 404 when reviewing non-existent hazard', async () => {
      const res = await request(app)
        .put('/api/supervisor/hazards/99999/review')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          review_comment: 'comment',
          pass: true,
        });
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('隐患记录不存在');
    });

    it('should filter hazards by status', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards?status=rectifying')
        .set('Authorization', `Bearer ${supervisorToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.list)).toBe(true);
    });

    it('should filter hazards by warning status', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards?warningStatus=normal')
        .set('Authorization', `Bearer ${supervisorToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.list)).toBe(true);
    });
  });
});
