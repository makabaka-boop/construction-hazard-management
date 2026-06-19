import { app, request, authHeader } from './setup';

describe('管理员接口测试', () => {
  describe('项目管理', () => {
    it('应该能获取项目列表', async () => {
      const res = await request(app)
        .get('/api/admin/projects')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(res.body.list).toBeDefined();
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('应该支持分页查询项目', async () => {
      const res = await request(app)
        .get('/api/admin/projects?page=1&pageSize=2')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(res.body.list.length).toBeLessThanOrEqual(2);
      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(2);
    });

    it('应该支持关键词搜索项目', async () => {
      const res = await request(app)
        .get('/api/admin/projects?keyword=城市')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('应该能创建新项目', async () => {
      const res = await request(app)
        .post('/api/admin/projects')
        .set(authHeader('admin'))
        .send({ name: '测试项目', code: 'TEST001' });
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('测试项目');
    });

    it('创建项目名称和编码不能为空', async () => {
      const res = await request(app)
        .post('/api/admin/projects')
        .set(authHeader('admin'))
        .send({ name: '', code: '' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('项目名称和编码不能为空');
    });

    it('重复项目编码应该失败', async () => {
      await request(app)
        .post('/api/admin/projects')
        .set(authHeader('admin'))
        .send({ name: '项目1', code: 'DUP001' });
      
      const res = await request(app)
        .post('/api/admin/projects')
        .set(authHeader('admin'))
        .send({ name: '项目2', code: 'DUP001' });
      
      expect(res.status).toBe(400);
    });

    it('应该能更新项目', async () => {
      const createRes = await request(app)
        .post('/api/admin/projects')
        .set(authHeader('admin'))
        .send({ name: '旧名称', code: 'UPD001' });
      
      const res = await request(app)
        .put(`/api/admin/projects/${createRes.body.id}`)
        .set(authHeader('admin'))
        .send({ name: '新名称', code: 'UPD001' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('应该能删除项目', async () => {
      const createRes = await request(app)
        .post('/api/admin/projects')
        .set(authHeader('admin'))
        .send({ name: '待删除', code: 'DEL001' });
      
      const res = await request(app)
        .delete(`/api/admin/projects/${createRes.body.id}`)
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('楼层管理', () => {
    it('应该能获取楼层列表', async () => {
      const res = await request(app)
        .get('/api/admin/floors')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(res.body.list).toBeDefined();
    });

    it('应该能创建楼层', async () => {
      const res = await request(app)
        .post('/api/admin/floors')
        .set(authHeader('admin'))
        .send({ project_id: 1, name: '测试层', code: 'TF01' });
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
    });
  });

  describe('区域管理', () => {
    it('应该能获取区域列表', async () => {
      const res = await request(app)
        .get('/api/admin/areas')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(res.body.list).toBeDefined();
    });

    it('应该能创建区域', async () => {
      const res = await request(app)
        .post('/api/admin/areas')
        .set(authHeader('admin'))
        .send({ floor_id: 1, name: '测试区域', code: 'TA01' });
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
    });
  });

  describe('隐患类型管理', () => {
    it('应该能获取隐患类型列表', async () => {
      const res = await request(app)
        .get('/api/admin/hazard-types?parentId=null')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(res.body.list.length).toBeGreaterThan(0);
    });

    it('应该能创建隐患类型', async () => {
      const res = await request(app)
        .post('/api/admin/hazard-types')
        .set(authHeader('admin'))
        .send({ parent_id: null, name: '新类型', code: 'NEW01' });
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
    });
  });

  describe('责任小组管理', () => {
    it('应该能获取小组列表', async () => {
      const res = await request(app)
        .get('/api/admin/groups')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(res.body.list.length).toBeGreaterThan(0);
    });

    it('应该能创建小组', async () => {
      const res = await request(app)
        .post('/api/admin/groups')
        .set(authHeader('admin'))
        .send({ name: '新小组', leader: '组长', phone: '13800000000' });
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
    });
  });

  describe('整改时限规则', () => {
    it('应该能获取时限规则列表', async () => {
      const res = await request(app)
        .get('/api/admin/deadline-rules')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(res.body.list).toBeDefined();
    });

    it('创建时限规则必填项不能为空', async () => {
      const res = await request(app)
        .post('/api/admin/deadline-rules')
        .set(authHeader('admin'))
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('隐患分类和默认天数不能为空');
    });

    it('应该能更新时限规则', async () => {
      const res = await request(app)
        .put('/api/admin/deadline-rules/1')
        .set(authHeader('admin'))
        .send({ default_days: 10 });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('更新时限规则默认天数不能为空', async () => {
      const res = await request(app)
        .put('/api/admin/deadline-rules/1')
        .set(authHeader('admin'))
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('默认天数不能为空');
    });
  });
});
