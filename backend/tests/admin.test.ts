process.env.NODE_ENV = 'test';

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { setupTestEnv, teardownTestEnv, generateToken } from './testHelper';

describe('Admin API Tests', () => {
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

    const adminRouter = require('../src/routes/admin').default;
    app.use('/api/admin', adminRouter);
  });

  afterEach(() => {
    teardownTestEnv(db);
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/admin/projects');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('未提供认证令牌');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/admin/projects')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.status).toBe(401);
    });

    it('should return 403 when executor accesses admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/projects')
        .set('Authorization', `Bearer ${executorToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('权限不足');
    });

    it('should return 403 when supervisor accesses admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/projects')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow admin access', async () => {
      const res = await request(app)
        .get('/api/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Projects CRUD', () => {
    it('should get projects list', async () => {
      const res = await request(app)
        .get('/api/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.list)).toBe(true);
    });

    it('should create a new project', async () => {
      const res = await request(app)
        .post('/api/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '新项目', code: 'NEW001' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('新项目');
    });

    it('should return 400 when creating project with missing fields', async () => {
      const res = await request(app)
        .post('/api/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '新项目' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('项目名称和编码不能为空');
    });

    it('should update a project', async () => {
      const createRes = await request(app)
        .post('/api/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '旧项目', code: 'OLD001' });
      
      const res = await request(app)
        .put(`/api/admin/projects/${createRes.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '更新项目', code: 'UPD001' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should delete a project', async () => {
      const createRes = await request(app)
        .post('/api/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '待删除', code: 'DEL001' });
      
      const res = await request(app)
        .delete(`/api/admin/projects/${createRes.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Floors CRUD', () => {
    it('should get floors list', async () => {
      const res = await request(app)
        .get('/api/admin/floors')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
    });

    it('should create a floor', async () => {
      const res = await request(app)
        .post('/api/admin/floors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ project_id: basic.projectId, name: '2层', code: 'F02' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
    });
  });

  describe('Areas CRUD', () => {
    it('should get areas list', async () => {
      const res = await request(app)
        .get('/api/admin/areas')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
    });

    it('should create an area', async () => {
      const res = await request(app)
        .post('/api/admin/areas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ floor_id: basic.floorId, name: '西区', code: 'A02' });
      
      expect(res.status).toBe(200);
    });
  });

  describe('Hazard Types CRUD', () => {
    it('should get hazard types list', async () => {
      const res = await request(app)
        .get('/api/admin/hazard-types')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
    });

    it('should create a hazard type', async () => {
      const res = await request(app)
        .post('/api/admin/hazard-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ parent_id: null, name: '新分类', code: 'HT99' });
      
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('新分类');
    });
  });

  describe('Groups CRUD', () => {
    it('should get groups list', async () => {
      const res = await request(app)
        .get('/api/admin/groups')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
    });

    it('should create a group', async () => {
      const res = await request(app)
        .post('/api/admin/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '新班组', leader: '新组长', phone: '13900000000' });
      
      expect(res.status).toBe(200);
    });
  });

  describe('Deadline Rules', () => {
    it('should get deadline rules', async () => {
      const res = await request(app)
        .get('/api/admin/deadline-rules')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
    });

    it('should create a deadline rule', async () => {
      const parentTypeRes = await request(app)
        .post('/api/admin/hazard-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ parent_id: null, name: '测试分类', code: 'HT99' });

      const res = await request(app)
        .post('/api/admin/deadline-rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ hazard_type_parent_id: parentTypeRes.body.id, default_days: 10 });
      
      expect(res.status).toBe(200);
      expect(res.body.default_days).toBe(10);
    });

    it('should return 400 when creating deadline rule with missing fields', async () => {
      const res = await request(app)
        .post('/api/admin/deadline-rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('隐患分类和默认天数不能为空');
    });
  });
});
