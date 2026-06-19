import { createTestApp, request, getToken } from './test-utils';
import { Express } from 'express';

describe('执行人接口测试', () => {
  let app: Express;
  let executorToken: string;
  let executor2Token: string;

  beforeEach(() => {
    app = createTestApp();
    executorToken = getToken('executor');
    executor2Token = getToken('executor2');
  });

  describe('GET /api/executor/hazards', () => {
    it('应该只返回当前执行人的隐患列表', async () => {
      const res = await request(app)
        .get('/api/executor/hazards')
        .set('Authorization', `Bearer ${executorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(res.body).toHaveProperty('total');
      res.body.list.forEach((hazard: any) => {
        expect(hazard.executor_id).toBe(2);
      });
    });

    it('执行人2应该只能看到自己的隐患', async () => {
      const res = await request(app)
        .get('/api/executor/hazards')
        .set('Authorization', `Bearer ${executor2Token}`);

      expect(res.status).toBe(200);
      res.body.list.forEach((hazard: any) => {
        expect(hazard.executor_id).toBe(3);
      });
    });

    it('应该支持按状态筛选', async () => {
      const res = await request(app)
        .get('/api/executor/hazards?status=pending')
        .set('Authorization', `Bearer ${executorToken}`);

      expect(res.status).toBe(200);
      res.body.list.forEach((hazard: any) => {
        expect(hazard.status).toBe('pending');
        expect(hazard.executor_id).toBe(2);
      });
    });

    it('应该支持分页', async () => {
      const res = await request(app)
        .get('/api/executor/hazards?page=1&pageSize=2')
        .set('Authorization', `Bearer ${executorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.list.length).toBeLessThanOrEqual(2);
      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(2);
    });

    it('应该返回预警信息', async () => {
      const res = await request(app)
        .get('/api/executor/hazards')
        .set('Authorization', `Bearer ${executorToken}`);

      expect(res.status).toBe(200);
      const hazard = res.body.list[0];
      expect(hazard).toHaveProperty('warning_status');
      expect(hazard).toHaveProperty('is_overdue');
    });
  });

  describe('POST /api/executor/hazards', () => {
    it('应该成功创建新隐患', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const res = await request(app)
        .post('/api/executor/hazards')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          project_id: 1,
          floor_id: 1,
          area_id: 1,
          hazard_type_id: 2,
          group_id: 1,
          description: '新创建的测试隐患',
          deadline_date: futureDate.toISOString().slice(0, 10),
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
    });

    it('创建隐患时必填项不能为空', async () => {
      const res = await request(app)
        .post('/api/executor/hazards')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          project_id: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('必填项不能为空');
    });

    it('新创建的隐患状态应该是待整改', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const createRes = await request(app)
        .post('/api/executor/hazards')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          project_id: 1,
          floor_id: 1,
          area_id: 1,
          hazard_type_id: 2,
          group_id: 1,
          description: '验证状态的隐患',
          deadline_date: futureDate.toISOString().slice(0, 10),
        });

      const listRes = await request(app)
        .get('/api/executor/hazards')
        .set('Authorization', `Bearer ${executorToken}`);

      const newHazard = listRes.body.list.find((h: any) => h.id === createRes.body.id);
      expect(newHazard).toBeDefined();
      expect(newHazard.status).toBe('pending');
    });
  });

  describe('PUT /api/executor/hazards/:id/rectify', () => {
    it('应该成功提交整改', async () => {
      const res = await request(app)
        .put('/api/executor/hazards/1/rectify')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          rectification_desc: '已完成整改，现场已修复',
          rectification_photos: 'photo1.jpg',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('整改说明不能为空', async () => {
      const res = await request(app)
        .put('/api/executor/hazards/1/rectify')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          rectification_desc: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('整改说明不能为空');
    });

    it('不能整改不属于自己的隐患', async () => {
      const res = await request(app)
        .put('/api/executor/hazards/4/rectify')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          rectification_desc: '尝试整改别人的隐患',
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('隐患记录不存在或无权限');
    });

    it('整改后状态应该变为整改中', async () => {
      await request(app)
        .put('/api/executor/hazards/1/rectify')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          rectification_desc: '整改完成',
        });

      const listRes = await request(app)
        .get('/api/executor/hazards?status=rectifying')
        .set('Authorization', `Bearer ${executorToken}`);

      const rectifiedHazard = listRes.body.list.find((h: any) => h.id === 1);
      expect(rectifiedHazard).toBeDefined();
      expect(rectifiedHazard.status).toBe('rectifying');
    });

    it('整改不存在的隐患应返回404', async () => {
      const res = await request(app)
        .put('/api/executor/hazards/99999/rectify')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          rectification_desc: '整改不存在的隐患',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/executor/hazards/export', () => {
    it('应该导出执行人的隐患Excel', async () => {
      const res = await request(app)
        .get('/api/executor/hazards/export')
        .set('Authorization', `Bearer ${executorToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml');
    });
  });
});
