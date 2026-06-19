process.env.NODE_ENV = 'test';

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { setupTestEnv, teardownTestEnv } from './testHelper';

describe('Auth API Tests', () => {
  let db: any;
  let app: express.Express;

  beforeEach(() => {
    const env = setupTestEnv();
    db = env.db;

    app = express();
    app.use(cors());
    app.use(express.json());

    const authRouter = require('../src/routes/auth').default;
    app.use('/api/auth', authRouter);
  });

  afterEach(() => {
    teardownTestEnv(db);
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct admin credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toBe('admin');
      expect(res.body.user.role).toBe('admin');
    });

    it('should login as executor successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'executor', password: 'exec123' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('executor');
    });

    it('should login as supervisor successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'supervisor', password: 'super123' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('supervisor');
    });

    it('should return 400 when username is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'admin123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('用户名和密码不能为空');
    });

    it('should return 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('用户名和密码不能为空');
    });

    it('should return 401 with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrongpass' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('用户名或密码错误');
    });

    it('should return 401 with non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'admin123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('用户名或密码错误');
    });
  });
});
