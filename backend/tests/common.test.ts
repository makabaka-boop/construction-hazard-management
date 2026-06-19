process.env.NODE_ENV = 'test';

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { setupTestEnv, teardownTestEnv, generateToken } from './testHelper';

describe('Common API Tests', () => {
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

    const commonRouter = require('../src/routes/common').default;
    const executorRouter = require('../src/routes/executor').default;
    app.use('/api/common', commonRouter);
    app.use('/api/executor', executorRouter);
  });

  afterEach(() => {
    teardownTestEnv(db);
  });

  describe('Authentication', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/common/projects/all');
      expect(res.status).toBe(401);
    });

    it('should allow any authenticated user access', async () => {
      const res1 = await request(app)
        .get('/api/common/projects/all')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res1.status).toBe(200);

      const res2 = await request(app)
        .get('/api/common/projects/all')
        .set('Authorization', `Bearer ${executorToken}`);
      expect(res2.status).toBe(200);

      const res3 = await request(app)
        .get('/api/common/projects/all')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res3.status).toBe(200);
    });
  });

  describe('Common Data APIs', () => {
    it('should get all projects', async () => {
      const res = await request(app)
        .get('/api/common/projects/all')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get floors by project id', async () => {
      const res = await request(app)
        .get(`/api/common/floors/all?projectId=${basic.projectId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get areas by floor id', async () => {
      const res = await request(app)
        .get(`/api/common/areas/all?floorId=${basic.floorId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get hazard types (root)', async () => {
      const res = await request(app)
        .get('/api/common/hazard-types/all?parentId=null')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get all groups', async () => {
      const res = await request(app)
        .get('/api/common/groups/all')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get deadline rules', async () => {
      const res = await request(app)
        .get('/api/common/deadline-rules/all')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Virtual Hazards List', () => {
    it('should get virtual hazards with pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/executor/hazards')
          .set('Authorization', `Bearer ${executorToken}`)
          .send({
            project_id: basic.projectId,
            floor_id: basic.floorId,
            area_id: basic.areaId,
            hazard_type_id: basic.hazardTypeId,
            group_id: basic.groupId,
            description: `隐患 ${i}`,
          });
      }

      const res = await request(app)
        .get('/api/common/hazards/virtual?page=1&pageSize=10')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.list)).toBe(true);
    });

    it('should filter virtual hazards by status', async () => {
      const res = await request(app)
        .get('/api/common/hazards/virtual?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.list)).toBe(true);
    });
  });
});
