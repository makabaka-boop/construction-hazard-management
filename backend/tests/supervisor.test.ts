import { createTestApp, request, getToken } from './test-utils';
import { Express } from 'express';

describe('监督员接口测试', () => {
  let app: Express;
  let supervisorToken: string;
  let executorToken: string;

  beforeEach(() => {
    app = createTestApp();
    supervisorToken = getToken('supervisor');
    executorToken = getToken('executor');
  });

  describe('GET /api/supervisor/hazards', () => {
    it('应该返回所有隐患列表', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.list)).toBe(true);
    });

    it('应该支持按状态筛选', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards?status=pending')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      res.body.list.forEach((hazard: any) => {
        expect(hazard.status).toBe('pending');
      });
    });

    it('应该支持按项目筛选', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards?projectId=1')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      res.body.list.forEach((hazard: any) => {
        expect(hazard.project_id).toBe(1);
      });
    });

    it('应该支持预警状态筛选', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards?warningStatus=overdue')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      res.body.list.forEach((hazard: any) => {
        expect(hazard.warning_status).toBe('overdue');
      });
    });

    it('应该返回预警信息', async () => {
      const res = await request(app)
        .get('/api/supervisor/hazards')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      const hazard = res.body.list[0];
      expect(hazard).toHaveProperty('warning_status');
      expect(hazard).toHaveProperty('is_overdue');
      expect(hazard).toHaveProperty('remaining_days');
    });
  });

  describe('PUT /api/supervisor/hazards/:id/review', () => {
    it('审核通过应该关闭隐患', async () => {
      await request(app)
        .put('/api/executor/hazards/3/rectify')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({ rectification_desc: '整改完成' });

      const res = await request(app)
        .put('/api/supervisor/hazards/3/review')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ pass: true, review_comment: '整改合格' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const listRes = await request(app)
        .get('/api/common/hazards/virtual')
        .set('Authorization', `Bearer ${supervisorToken}`);
      
      const closedHazard = listRes.body.list.find((h: any) => h.id === 3);
      expect(closedHazard.status).toBe('closed');
      expect(closedHazard.supervisor_id).toBe(4);
    });

    it('审核不通过应该退回待整改', async () => {
      await request(app)
        .put('/api/executor/hazards/3/rectify')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({ rectification_desc: '整改完成' });

      const res = await request(app)
        .put('/api/supervisor/hazards/3/review')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ pass: false, review_comment: '整改不合格，需重新整改' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const listRes = await request(app)
        .get('/api/common/hazards/virtual')
        .set('Authorization', `Bearer ${supervisorToken}`);
      
      const pendingHazard = listRes.body.list.find((h: any) => h.id === 3);
      expect(pendingHazard.status).toBe('pending');
    });

    it('审核不存在的隐患应返回404', async () => {
      const res = await request(app)
        .put('/api/supervisor/hazards/99999/review')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ pass: true });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('隐患记录不存在');
    });
  });

  describe('隐患完整流程测试', () => {
    it('新增->整改->复核通过 完整流程', async () => {
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
          description: '流程测试隐患',
          deadline_date: futureDate.toISOString().slice(0, 10),
        });
      
      expect(createRes.status).toBe(200);
      const hazardId = createRes.body.id;

      let hazardRes = await request(app)
        .get(`/api/common/hazards/virtual`)
        .set('Authorization', `Bearer ${supervisorToken}`);
      let hazard = hazardRes.body.list.find((h: any) => h.id === hazardId);
      expect(hazard.status).toBe('pending');

      const rectifyRes = await request(app)
        .put(`/api/executor/hazards/${hazardId}/rectify`)
        .set('Authorization', `Bearer ${executorToken}`)
        .send({ rectification_desc: '已完成整改工作' });
      expect(rectifyRes.status).toBe(200);

      hazardRes = await request(app)
        .get(`/api/common/hazards/virtual`)
        .set('Authorization', `Bearer ${supervisorToken}`);
      hazard = hazardRes.body.list.find((h: any) => h.id === hazardId);
      expect(hazard.status).toBe('rectifying');

      const reviewRes = await request(app)
        .put(`/api/supervisor/hazards/${hazardId}/review`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ pass: true, review_comment: '验收通过' });
      expect(reviewRes.status).toBe(200);

      hazardRes = await request(app)
        .get(`/api/common/hazards/virtual`)
        .set('Authorization', `Bearer ${supervisorToken}`);
      hazard = hazardRes.body.list.find((h: any) => h.id === hazardId);
      expect(hazard.status).toBe('closed');
      expect(hazard.review_comment).toBe('验收通过');
    });

    it('新增->整改->复核不通过->重新整改 流程', async () => {
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
          description: '退回流程测试',
          deadline_date: futureDate.toISOString().slice(0, 10),
        });
      
      const hazardId = createRes.body.id;

      await request(app)
        .put(`/api/executor/hazards/${hazardId}/rectify`)
        .set('Authorization', `Bearer ${executorToken}`)
        .send({ rectification_desc: '初次整改' });

      await request(app)
        .put(`/api/supervisor/hazards/${hazardId}/review`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ pass: false, review_comment: '不合格' });

      let hazardRes = await request(app)
        .get(`/api/common/hazards/virtual`)
        .set('Authorization', `Bearer ${supervisorToken}`);
      let hazard = hazardRes.body.list.find((h: any) => h.id === hazardId);
      expect(hazard.status).toBe('pending');

      await request(app)
        .put(`/api/executor/hazards/${hazardId}/rectify`)
        .set('Authorization', `Bearer ${executorToken}`)
        .send({ rectification_desc: '重新整改完成' });

      hazardRes = await request(app)
        .get(`/api/common/hazards/virtual`)
        .set('Authorization', `Bearer ${supervisorToken}`);
      hazard = hazardRes.body.list.find((h: any) => h.id === hazardId);
      expect(hazard.status).toBe('rectifying');
    });
  });
});
