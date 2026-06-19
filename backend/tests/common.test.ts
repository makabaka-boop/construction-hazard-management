import { createTestApp, request, getToken } from './test-utils';
import { Express } from 'express';

describe('公共接口测试', () => {
  let app: Express;
  let adminToken: string;

  beforeEach(async () => {
    app = createTestApp();
    adminToken = getToken('admin');
  });

  describe('GET /api/common/projects/all', () => {
    it('应该返回所有项目列表', async () => {
      const res = await request(app)
        .get('/api/common/projects/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('code');
    });

    it('应该支持关键词搜索项目', async () => {
      const res = await request(app)
        .get('/api/common/projects/all?keyword=测试项目A')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].name).toContain('测试项目A');
    });
  });

  describe('GET /api/common/floors/all', () => {
    it('应该返回指定项目的楼层列表', async () => {
      const res = await request(app)
        .get('/api/common/floors/all?projectId=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      res.body.forEach((floor: any) => {
        expect(floor.project_id).toBe(1);
      });
    });
  });

  describe('GET /api/common/areas/all', () => {
    it('应该返回指定楼层的区域列表', async () => {
      const res = await request(app)
        .get('/api/common/areas/all?floorId=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      res.body.forEach((area: any) => {
        expect(area.floor_id).toBe(1);
      });
    });
  });

  describe('GET /api/common/hazard-types/all', () => {
    it('应该返回顶级隐患类型', async () => {
      const res = await request(app)
        .get('/api/common/hazard-types/all?parentId=null')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((type: any) => {
        expect(type.parent_id).toBeNull();
      });
    });

    it('应该返回子级隐患类型', async () => {
      const res = await request(app)
        .get('/api/common/hazard-types/all?parentId=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((type: any) => {
        expect(type.parent_id).toBe(1);
      });
    });
  });

  describe('GET /api/common/groups/all', () => {
    it('应该返回所有责任小组', async () => {
      const res = await request(app)
        .get('/api/common/groups/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/common/deadline-rules/all', () => {
    it('应该返回所有整改期限规则', async () => {
      const res = await request(app)
        .get('/api/common/deadline-rules/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/common/hazards/virtual', () => {
    it('应该返回隐患分页列表', async () => {
      const res = await request(app)
        .get('/api/common/hazards/virtual?page=1&pageSize=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('pageSize', 10);
      expect(Array.isArray(res.body.list)).toBe(true);
    });

    it('应该支持按状态筛选', async () => {
      const res = await request(app)
        .get('/api/common/hazards/virtual?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.list.forEach((hazard: any) => {
        expect(hazard.status).toBe('pending');
      });
    });

    it('应该支持按项目筛选', async () => {
      const res = await request(app)
        .get('/api/common/hazards/virtual?projectId=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.list.forEach((hazard: any) => {
        expect(hazard.project_id).toBe(1);
      });
    });

    it('应该支持关键词搜索', async () => {
      const res = await request(app)
        .get('/api/common/hazards/virtual?keyword=超期')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.list.length).toBeGreaterThanOrEqual(1);
    });

    it('应该返回预警信息字段', async () => {
      const res = await request(app)
        .get('/api/common/hazards/virtual')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const hazard = res.body.list[0];
      expect(hazard).toHaveProperty('warning_status');
      expect(hazard).toHaveProperty('is_overdue');
      expect(hazard).toHaveProperty('remaining_days');
      expect(hazard).toHaveProperty('overdue_days');
    });
  });

  describe('GET /api/common/hazards/export', () => {
    it('应该导出Excel文件', async () => {
      const res = await request(app)
        .get('/api/common/hazards/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml');
    });
  });

  describe('GET /api/health', () => {
    it('应该返回健康状态', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('timestamp');
    });
  });
});
