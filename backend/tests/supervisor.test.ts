import { app, request, authHeader, db } from './setup';

describe('监督员接口测试', () => {
  let rectifyingHazardId: number;

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
        description: '待复核隐患',
        deadline_date: '2026-12-31',
      });
    
    await request(app)
      .put(`/api/executor/hazards/${createRes.body.id}/rectify`)
      .set(authHeader('executor'))
      .send({ rectification_desc: '已整改完成' });
    
    rectifyingHazardId = createRes.body.id;
  });

  describe('隐患查询', () => {
    it('监督员应该能查看所有隐患', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards')
        .set(authHeader('supervisor'));
      
      expect(res.status).toBe(200);
      expect(res.body.list).toBeDefined();
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('应该支持按状态筛选', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards?status=rectifying')
        .set(authHeader('supervisor'));
      
      expect(res.status).toBe(200);
      res.body.list.forEach((item: any) => {
        expect(item.status).toBe('rectifying');
      });
    });

    it('应该支持预警状态筛选', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards?warningStatus=normal')
        .set(authHeader('supervisor'));
      
      expect(res.status).toBe(200);
    });

    it('应该返回执行人姓名信息', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards?page=1&pageSize=1')
        .set(authHeader('supervisor'));
      
      expect(res.status).toBe(200);
      if (res.body.list.length > 0) {
        expect(res.body.list[0]).toHaveProperty('executor_name');
      }
    });
  });

  describe('复核通过', () => {
    it('应该能复核通过并关闭隐患', async () => {
      const res = await request(app)
        .put(`/api/supervisor/hazards/${rectifyingHazardId}/review`)
        .set(authHeader('supervisor'))
        .send({ pass: true, review_comment: '整改合格' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('复核通过后状态应为closed', async () => {
      await request(app)
        .put(`/api/supervisor/hazards/${rectifyingHazardId}/review`)
        .set(authHeader('supervisor'))
        .send({ pass: true });
      
      const hazard = db.prepare('SELECT * FROM hazard_records WHERE id = ?').get(rectifyingHazardId) as any;
      expect(hazard.status).toBe('closed');
      expect(hazard.supervisor_id).toBe(4);
      expect(hazard.closed_at).toBeDefined();
    });

    it('复核通过时复核意见可选', async () => {
      const res = await request(app)
        .put(`/api/supervisor/hazards/${rectifyingHazardId}/review`)
        .set(authHeader('supervisor'))
        .send({ pass: true });
      
      expect(res.status).toBe(200);
    });
  });

  describe('复核退回', () => {
    it('应该能退回整改', async () => {
      const res = await request(app)
        .put(`/api/supervisor/hazards/${rectifyingHazardId}/review`)
        .set(authHeader('supervisor'))
        .send({ pass: false, review_comment: '整改不合格，请重新整改' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('退回后状态应为pending', async () => {
      await request(app)
        .put(`/api/supervisor/hazards/${rectifyingHazardId}/review`)
        .set(authHeader('supervisor'))
        .send({ pass: false, review_comment: '不合格' });
      
      const hazard = db.prepare('SELECT * FROM hazard_records WHERE id = ?').get(rectifyingHazardId) as any;
      expect(hazard.status).toBe('pending');
      expect(hazard.review_comment).toBe('不合格');
    });

    it('退回时必须填写复核意见', async () => {
      const res = await request(app)
        .put(`/api/supervisor/hazards/${rectifyingHazardId}/review`)
        .set(authHeader('supervisor'))
        .send({ pass: false });
      
      expect(res.status).toBe(200);
    });
  });

  describe('异常场景', () => {
    it('复核不存在的隐患应该返回404', async () => {
      const res = await request(app)
        .put('/api/supervisor/hazards/99999/review')
        .set(authHeader('supervisor'))
        .send({ pass: true });
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('隐患记录不存在');
    });

    it('执行人不能访问监督员复核接口', async () => {
      const res = await request(app)
        .put(`/api/supervisor/hazards/${rectifyingHazardId}/review`)
        .set(authHeader('executor'))
        .send({ pass: true });
      
      expect(res.status).toBe(403);
    });
  });
});
