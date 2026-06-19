import { createTestApp, request, getToken } from './test-utils';
import { Express } from 'express';

describe('管理员接口测试', () => {
  let app: Express;
  let adminToken: string;

  beforeEach(() => {
    app = createTestApp();
    adminToken = getToken('admin');
  });

  describe('项目管理', () => {
    it('应该获取项目分页列表', async () => {
      const res = await request(app)
        .get('/api/admin/projects?page=1&pageSize=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.list)).toBe(true);
    });

    it('应该创建新项目', async () => {
      const res = await request(app)
        .post('/api/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '新建测试项目', code: 'NEW001' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('新建测试项目');
      expect(res.body.code).toBe('NEW001');
    });

    it('创建项目时名称和编码不能为空', async () => {
      const res = await request(app)
        .post('/api/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '', code: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('项目名称和编码不能为空');
    });

    it('应该更新项目', async () => {
      const createRes = await request(app)
        .post('/api/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '待更新项目', code: 'UPD001' });

      const res = await request(app)
        .put(`/api/admin/projects/${createRes.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '已更新项目', code: 'UPD001' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('应该删除项目', async () => {
      const createRes = await request(app)
        .post('/api/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '待删除项目', code: 'DEL001' });

      const res = await request(app)
        .delete(`/api/admin/projects/${createRes.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('楼层管理', () => {
    it('应该创建楼层', async () => {
      const res = await request(app)
        .post('/api/admin/floors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ project_id: 1, name: '测试楼层', code: 'TF01' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
    });

    it('应该获取楼层列表', async () => {
      const res = await request(app)
        .get('/api/admin/floors?projectId=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
    });
  });

  describe('区域管理', () => {
    it('应该创建区域', async () => {
      const res = await request(app)
        .post('/api/admin/areas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ floor_id: 1, name: '测试区域', code: 'TA01' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
    });

    it('应该获取区域列表', async () => {
      const res = await request(app)
        .get('/api/admin/areas?floorId=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
    });
  });

  describe('隐患类型管理', () => {
    it('应该创建隐患类型', async () => {
      const res = await request(app)
        .post('/api/admin/hazard-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ parent_id: null, name: '新隐患类型', code: 'NHT01' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
    });

    it('应该获取隐患类型列表', async () => {
      const res = await request(app)
        .get('/api/admin/hazard-types')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
    });
  });

  describe('责任小组管理', () => {
    it('应该创建责任小组', async () => {
      const res = await request(app)
        .post('/api/admin/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '新班组', leader: '张组长', phone: '13900139000' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
    });
  });

  describe('整改期限规则管理', () => {
    it('应该创建整改期限规则', async () => {
      const typeRes = await request(app)
        .post('/api/admin/hazard-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ parent_id: null, name: '新分类', code: 'NEWCAT' });

      const res = await request(app)
        .post('/api/admin/deadline-rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ hazard_type_parent_id: typeRes.body.id, default_days: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
    });

    it('创建规则时必填项不能为空', async () => {
      const res = await request(app)
        .post('/api/admin/deadline-rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('隐患分类和默认天数不能为空');
    });

    it('应该获取整改期限规则列表', async () => {
      const res = await request(app)
        .get('/api/admin/deadline-rules')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
    });

    it('应该更新整改期限规则', async () => {
      const res = await request(app)
        .put('/api/admin/deadline-rules/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ default_days: 15 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
