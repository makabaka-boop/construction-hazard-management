import { app, request, authHeader } from './setup';

describe('公共接口测试', () => {
  describe('级联选择数据', () => {
    it('应该能获取所有项目', async () => {
      const res = await request(app)
        .get('/api/common/projects/all')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('应该支持关键词搜索项目', async () => {
      const res = await request(app)
        .get('/api/common/projects/all?keyword=城市')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('应该能获取指定项目的楼层', async () => {
      const res = await request(app)
        .get('/api/common/floors/all?projectId=1')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      res.body.forEach((floor: any) => {
        expect(floor.project_id).toBe(1);
      });
    });

    it('应该能获取指定楼层的区域', async () => {
      const res = await request(app)
        .get('/api/common/areas/all?floorId=1')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('应该能获取一级隐患类型', async () => {
      const res = await request(app)
        .get('/api/common/hazard-types/all?parentId=null')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      res.body.forEach((type: any) => {
        expect(type.parent_id).toBeNull();
      });
    });

    it('应该能获取二级隐患类型', async () => {
      const res = await request(app)
        .get('/api/common/hazard-types/all?parentId=1')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((type: any) => {
        expect(type.parent_id).toBe(1);
      });
    });

    it('应该能获取所有责任小组', async () => {
      const res = await request(app)
        .get('/api/common/groups/all')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('应该能获取所有整改时限规则', async () => {
      const res = await request(app)
        .get('/api/common/deadline-rules/all')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('虚拟列表接口', () => {
    it('应该支持分页获取虚拟列表数据', async () => {
      const res = await request(app)
        .get('/api/common/hazards/virtual?page=1&pageSize=20')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(res.body.list).toBeDefined();
      expect(res.body.total).toBeGreaterThan(0);
      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(20);
    });

    it('应该返回隐患分类父子信息', async () => {
      const res = await request(app)
        .get('/api/common/hazards/virtual?page=1&pageSize=1')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      if (res.body.list.length > 0) {
        const item = res.body.list[0];
        expect(item).toHaveProperty('hazard_type_parent_id');
        expect(item).toHaveProperty('hazard_type_parent_name');
      }
    });

    it('应该支持多条件筛选', async () => {
      const res = await request(app)
        .get('/api/common/hazards/virtual?projectId=1&status=pending&page=1&pageSize=10')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      res.body.list.forEach((item: any) => {
        expect(item.project_id).toBe(1);
        expect(item.status).toBe('pending');
      });
    });

    it('应该支持关键词搜索', async () => {
      const res = await request(app)
        .get('/api/common/hazards/virtual?keyword=隐患&page=1&pageSize=10')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
    });

    it('返回数据应包含预警信息', async () => {
      const res = await request(app)
        .get('/api/common/hazards/virtual?page=1&pageSize=1')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      if (res.body.list.length > 0) {
        const item = res.body.list[0];
        expect(item).toHaveProperty('warning_status');
        expect(item).toHaveProperty('remaining_days');
        expect(item).toHaveProperty('is_overdue');
      }
    });
  });

  describe('导出接口', () => {
    it('应该能导出Excel', async () => {
      const res = await request(app)
        .get('/api/common/hazards/export')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml');
    });

    it('应该支持按状态筛选导出', async () => {
      const res = await request(app)
        .get('/api/common/hazards/export?status=closed')
        .set(authHeader('admin'));
      
      expect(res.status).toBe(200);
    });
  });

  describe('健康检查', () => {
    it('健康检查接口应该正常返回', async () => {
      const res = await request(app).get('/api/health');
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });
});
