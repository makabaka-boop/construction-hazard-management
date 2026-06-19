import { app, request, authHeader, db } from './setup';

describe('执行人接口测试', () => {
  describe('隐患查询', () => {
    it('执行人应该能获取分配给自己的隐患列表', async () => {
      const res = await request(app)
        .get('/api/executor/hazards')
        .set(authHeader('executor'));
      
      expect(res.status).toBe(200);
      expect(res.body.list).toBeDefined();
    });

    it('应该支持按状态筛选隐患', async () => {
      const res = await request(app)
        .get('/api/executor/hazards?status=pending')
        .set(authHeader('executor'));
      
      expect(res.status).toBe(200);
      res.body.list.forEach((item: any) => {
        expect(item.status).toBe('pending');
      });
    });

    it('应该支持按项目筛选隐患', async () => {
      const res = await request(app)
        .get('/api/executor/hazards?projectId=1')
        .set(authHeader('executor'));
      
      expect(res.status).toBe(200);
      res.body.list.forEach((item: any) => {
        expect(item.project_id).toBe(1);
      });
    });

    it('应该支持关键词搜索', async () => {
      const res = await request(app)
        .get('/api/executor/hazards?keyword=隐患')
        .set(authHeader('executor'));
      
      expect(res.status).toBe(200);
    });

    it('应该支持分页查询', async () => {
      const res = await request(app)
        .get('/api/executor/hazards?page=1&pageSize=5')
        .set(authHeader('executor'));
      
      expect(res.status).toBe(200);
      expect(res.body.list.length).toBeLessThanOrEqual(5);
    });

    it('返回数据应包含预警信息', async () => {
      const res = await request(app)
        .get('/api/executor/hazards?page=1&pageSize=1')
        .set(authHeader('executor'));
      
      expect(res.status).toBe(200);
      if (res.body.list.length > 0) {
        const item = res.body.list[0];
        expect(item).toHaveProperty('warning_status');
        expect(item).toHaveProperty('remaining_days');
        expect(item).toHaveProperty('is_overdue');
      }
    });
  });

  describe('新增隐患', () => {
    const validHazardData = {
      project_id: 1,
      floor_id: 1,
      area_id: 1,
      hazard_type_id: 6,
      group_id: 1,
      description: '测试隐患描述',
      deadline_date: '2026-12-31',
    };

    it('应该能成功新增隐患', async () => {
      const res = await request(app)
        .post('/api/executor/hazards')
        .set(authHeader('executor'))
        .send(validHazardData);
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
    });

    it('新增隐患必填项不能为空', async () => {
      const res = await request(app)
        .post('/api/executor/hazards')
        .set(authHeader('executor'))
        .send({ description: '只有描述' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('必填项不能为空');
    });

    it('缺少项目ID应该失败', async () => {
      const { project_id, ...data } = validHazardData;
      const res = await request(app)
        .post('/api/executor/hazards')
        .set(authHeader('executor'))
        .send(data);
      
      expect(res.status).toBe(400);
    });

    it('新增隐患默认状态应为pending', async () => {
      const createRes = await request(app)
        .post('/api/executor/hazards')
        .set(authHeader('executor'))
        .send(validHazardData);
      
      const hazard = db.prepare('SELECT * FROM hazard_records WHERE id = ?').get(createRes.body.id) as any;
      expect(hazard.status).toBe('pending');
      expect(hazard.executor_id).toBe(2);
    });
  });

  describe('整改隐患', () => {
    let testHazardId: number;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/executor/hazards')
        .set(authHeader('executor'))
        .send({
          project_id: 1,
          floor_id: 1,
          area_id: 1,
          hazard_type_id: 6,
          group_id: 1,
          description: '待整改隐患',
          deadline_date: '2026-12-31',
        });
      testHazardId = createRes.body.id;
    });

    it('应该能提交整改', async () => {
      const res = await request(app)
        .put(`/api/executor/hazards/${testHazardId}/rectify`)
        .set(authHeader('executor'))
        .send({ rectification_desc: '已完成整改' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('整改说明不能为空', async () => {
      const res = await request(app)
        .put(`/api/executor/hazards/${testHazardId}/rectify`)
        .set(authHeader('executor'))
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('整改说明不能为空');
    });

    it('不能整改他人的隐患', async () => {
      const res = await request(app)
        .put(`/api/executor/hazards/${testHazardId}/rectify`)
        .set(authHeader('executor2'))
        .send({ rectification_desc: '尝试整改' });
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('隐患记录不存在或无权限');
    });

    it('整改不存在的隐患应该返回404', async () => {
      const res = await request(app)
        .put('/api/executor/hazards/99999/rectify')
        .set(authHeader('executor'))
        .send({ rectification_desc: '整改不存在的' });
      
      expect(res.status).toBe(404);
    });

    it('整改成功后状态应为rectifying', async () => {
      await request(app)
        .put(`/api/executor/hazards/${testHazardId}/rectify`)
        .set(authHeader('executor'))
        .send({ rectification_desc: '已整改' });
      
      const hazard = db.prepare('SELECT * FROM hazard_records WHERE id = ?').get(testHazardId) as any;
      expect(hazard.status).toBe('rectifying');
      expect(hazard.rectification_desc).toBe('已整改');
      expect(hazard.rectified_at).toBeDefined();
    });
  });

  describe('导出Excel', () => {
    it('应该能导出Excel文件', async () => {
      const res = await request(app)
        .get('/api/executor/hazards/export')
        .set(authHeader('executor'));
      
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml');
      expect(res.headers['content-disposition']).toContain('attachment');
    });

    it('应该支持按条件筛选后导出', async () => {
      const res = await request(app)
        .get('/api/executor/hazards/export?status=pending')
        .set(authHeader('executor'));
      
      expect(res.status).toBe(200);
    });
  });
});
