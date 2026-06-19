process.env.NODE_ENV = 'test';

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { setupTestEnv, teardownTestEnv, generateToken } from './testHelper';

describe('Executor API Tests', () => {
  let db: any;
  let app: express.Express;
  let adminToken: string;
  let executorToken: string;
  let executor2Token: string;
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
    executor2Token = generateToken(users.executor2.id, users.executor2.username, users.executor2.role);
    supervisorToken = generateToken(users.supervisor.id, users.supervisor.username, users.supervisor.role);

    app = express();
    app.use(cors());
    app.use(express.json());

    const executorRouter = require('../src/routes/executor').default;
    app.use('/api/executor', executorRouter);
  });

  afterEach(() => {
    teardownTestEnv(db);
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/executor/hazards');
      expect(res.status).toBe(401);
    });

    it('should return 403 when supervisor accesses executor routes', async () => {
      const res = await request(app)
        .get('/api/executor/hazards')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow executor access', async () => {
      const res = await request(app)
        .get('/api/executor/hazards')
        .set('Authorization', `Bearer ${executorToken}`);
      expect(res.status).toBe(200);
    });

    it('should allow admin access to executor routes', async () => {
      const res = await request(app)
        .get('/api/executor/hazards')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Hazard Management', () => {
    it('should get hazards list (only own)', async () => {
      const res = await request(app)
        .get('/api/executor/hazards')
        .set('Authorization', `Bearer ${executorToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.list)).toBe(true);
    });

    it('should create a new hazard', async () => {
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 7);
      const deadlineStr = deadlineDate.toISOString().slice(0, 10);

      const res = await request(app)
        .post('/api/executor/hazards')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          project_id: basic.projectId,
          floor_id: basic.floorId,
          area_id: basic.areaId,
          hazard_type_id: basic.hazardTypeId,
          group_id: basic.groupId,
          description: '测试隐患描述',
          photos: '',
          deadline_date: deadlineStr,
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
    });

    it('should return 400 when creating hazard with missing required fields', async () => {
      const res = await request(app)
        .post('/api/executor/hazards')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          project_id: basic.projectId,
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('必填项不能为空');
    });

    it('should rectify a hazard', async () => {
      const createRes = await request(app)
        .post('/api/executor/hazards')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          project_id: basic.projectId,
          floor_id: basic.floorId,
          area_id: basic.areaId,
          hazard_type_id: basic.hazardTypeId,
          group_id: basic.groupId,
          description: '待整改隐患',
        });

      const res = await request(app)
        .put(`/api/executor/hazards/${createRes.body.id}/rectify`)
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          rectification_desc: '已完成整改',
          rectification_photos: '',
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when rectifying without description', async () => {
      const createRes = await request(app)
        .post('/api/executor/hazards')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          project_id: basic.projectId,
          floor_id: basic.floorId,
          area_id: basic.areaId,
          hazard_type_id: basic.hazardTypeId,
          group_id: basic.groupId,
          description: '待整改隐患',
        });

      const res = await request(app)
        .put(`/api/executor/hazards/${createRes.body.id}/rectify`)
        .set('Authorization', `Bearer ${executorToken}`)
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('整改说明不能为空');
    });

    it('should return 404 when rectifying non-existent hazard', async () => {
      const res = await request(app)
        .put('/api/executor/hazards/99999/rectify')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          rectification_desc: '整改说明',
        });
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('隐患记录不存在或无权限');
    });

    it('should return 404 when executor tries to rectify others hazard', async () => {
      const createRes = await request(app)
        .post('/api/executor/hazards')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          project_id: basic.projectId,
          floor_id: basic.floorId,
          area_id: basic.areaId,
          hazard_type_id: basic.hazardTypeId,
          group_id: basic.groupId,
          description: '我的隐患',
        });

      const res = await request(app)
        .put(`/api/executor/hazards/${createRes.body.id}/rectify`)
        .set('Authorization', `Bearer ${executor2Token}`)
        .send({
          rectification_desc: '想整改别人的隐患',
        });
      
      expect(res.status).toBe(404);
    });

    it('should filter hazards by status', async () => {
      await request(app)
        .post('/api/executor/hazards')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          project_id: basic.projectId,
          floor_id: basic.floorId,
          area_id: basic.areaId,
          hazard_type_id: basic.hazardTypeId,
          group_id: basic.groupId,
          description: 'pending hazard',
        });

      const res = await request(app)
        .get('/api/executor/hazards?status=pending')
        .set('Authorization', `Bearer ${executorToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.list)).toBe(true);
    });
  });
});
