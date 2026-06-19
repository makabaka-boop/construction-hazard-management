import { createTestApp, request } from './test-utils';
import { Express } from 'express';

describe('认证接口测试', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/auth/login', () => {
    it('应该成功登录管理员账户', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toBe('admin');
      expect(res.body.user.role).toBe('admin');
    });

    it('应该成功登录执行人账户', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'executor', password: 'exec123' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('executor');
    });

    it('应该成功登录监督员账户', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'supervisor', password: 'super123' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('supervisor');
    });

    it('用户名缺失时应返回400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'admin123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('用户名和密码不能为空');
    });

    it('密码缺失时应返回400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('用户名和密码不能为空');
    });

    it('用户名和密码都缺失时应返回400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });

    it('密码错误时应返回401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('用户名或密码错误');
    });

    it('用户不存在时应返回401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'admin123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('用户名或密码错误');
    });
  });

  describe('认证中间件测试', () => {
    it('未提供token时应返回401', async () => {
      const res = await request(app)
        .get('/api/common/projects/all');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('未提供认证令牌');
    });

    it('提供无效token时应返回401', async () => {
      const res = await request(app)
        .get('/api/common/projects/all')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('认证令牌无效或已过期');
    });

    it('Authorization格式错误时应返回401', async () => {
      const res = await request(app)
        .get('/api/common/projects/all')
        .set('Authorization', 'InvalidFormat token');

      expect(res.status).toBe(401);
    });
  });

  describe('权限中间件测试', () => {
    let adminToken: string;
    let executorToken: string;
    let supervisorToken: string;

    beforeEach(async () => {
      const adminRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });
      adminToken = adminRes.body.token;

      const executorRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'executor', password: 'exec123' });
      executorToken = executorRes.body.token;

      const supervisorRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'supervisor', password: 'super123' });
      supervisorToken = supervisorRes.body.token;
    });

    it('执行人不能访问管理员接口', async () => {
      const res = await request(app)
        .get('/api/admin/projects')
        .set('Authorization', `Bearer ${executorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('权限不足');
    });

    it('监督员不能访问管理员接口', async () => {
      const res = await request(app)
        .get('/api/admin/projects')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(403);
    });

    it('管理员访问执行人整改接口不属于自己的隐患返回404', async () => {
      const res = await request(app)
        .put('/api/executor/hazards/1/rectify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rectification_desc: '测试整改' });

      expect(res.status).toBe(404);
    });

    it('执行人不能访问监督员复核接口', async () => {
      const res = await request(app)
        .put('/api/supervisor/hazards/1/review')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({ pass: true });

      expect(res.status).toBe(403);
    });
  });
});
