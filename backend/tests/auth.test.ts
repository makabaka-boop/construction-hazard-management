import { app, request } from './setup';

describe('认证接口测试', () => {
  describe('POST /api/auth/login', () => {
    it('应该使用正确凭据成功登录', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });
      
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe('admin');
      expect(res.body.user.role).toBe('admin');
    });

    it('应该使用执行人账号登录成功', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'executor', password: 'exec123' });
      
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('executor');
    });

    it('应该使用监督员账号登录成功', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'supervisor', password: 'super123' });
      
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('supervisor');
    });

    it('用户名缺失时应该返回400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'admin123' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('用户名和密码不能为空');
    });

    it('密码缺失时应该返回400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('用户名和密码不能为空');
    });

    it('用户名错误时应该返回401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'wronguser', password: 'admin123' });
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('用户名或密码错误');
    });

    it('密码错误时应该返回401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrongpass' });
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('用户名或密码错误');
    });
  });
});

describe('认证中间件测试', () => {
  it('无token访问受保护接口应该返回401', async () => {
    const res = await request(app).get('/api/admin/projects');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('未提供认证令牌');
  });

  it('无效token应该返回401', async () => {
    const res = await request(app)
      .get('/api/admin/projects')
      .set('Authorization', 'Bearer invalidtoken');
    
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('认证令牌无效或已过期');
  });

  it('错误格式token应该返回401', async () => {
    const res = await request(app)
      .get('/api/admin/projects')
      .set('Authorization', 'InvalidFormat');
    
    expect(res.status).toBe(401);
  });
});

describe('角色权限测试', () => {
  it('执行人不能访问管理员接口', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'executor', password: 'exec123' });
    
    const res = await request(app)
      .get('/api/admin/projects')
      .set('Authorization', `Bearer ${loginRes.body.token}`);
    
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('权限不足');
  });

  it('监督员不能访问管理员接口', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'supervisor', password: 'super123' });
    
    const res = await request(app)
      .post('/api/admin/projects')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send({ name: 'Test', code: 'TEST' });
    
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('权限不足');
  });

  it('监督员不能访问执行人专属整改接口', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'supervisor', password: 'super123' });
    
    const res = await request(app)
      .put('/api/executor/hazards/1/rectify')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send({ rectification_desc: 'test' });
    
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('权限不足');
  });

  it('执行人不能访问监督员复核接口', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'executor', password: 'exec123' });
    
    const res = await request(app)
      .put('/api/supervisor/hazards/1/review')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send({ action: 'approve' });
    
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('权限不足');
  });
});
