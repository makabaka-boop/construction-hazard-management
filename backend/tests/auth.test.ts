import request from 'supertest';
import app from '../src/server';

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('should reject missing username/password', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should reject empty password', async () => {
      const res = await request(app).post('/api/auth/login').send({ username: 'admin' });
      expect(res.status).toBe(400);
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrong' });
      expect(res.status).toBe(401);
    });

    it('should reject unknown user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nobody', password: 'whatever' });
      expect(res.status).toBe(401);
    });

    it('should login admin successfully and return token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('admin');
      expect(res.body.user.username).toBe('admin');
    });

    it('should login executor and supervisor', async () => {
      const exec = await request(app)
        .post('/api/auth/login')
        .send({ username: 'executor', password: 'exec123' });
      expect(exec.status).toBe(200);
      expect(exec.body.user.role).toBe('executor');

      const sup = await request(app)
        .post('/api/auth/login')
        .send({ username: 'supervisor', password: 'super123' });
      expect(sup.status).toBe(200);
      expect(sup.body.user.role).toBe('supervisor');
    });
  });

  describe('Auth middleware', () => {
    it('returns 401 without Authorization header', async () => {
      const res = await request(app).get('/api/admin/projects');
      expect(res.status).toBe(401);
    });

    it('returns 401 with malformed Authorization header', async () => {
      const res = await request(app)
        .get('/api/admin/projects')
        .set('Authorization', 'Token abcdef');
      expect(res.status).toBe(401);
    });

    it('returns 401 with invalid jwt', async () => {
      const res = await request(app)
        .get('/api/admin/projects')
        .set('Authorization', 'Bearer not-a-valid-jwt');
      expect(res.status).toBe(401);
    });
  });

  describe('Health endpoint', () => {
    it('should respond ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
