import request from 'supertest';
import app from '../src/server';
import db, { initDatabase, clearDatabase, resetDatabase } from '../src/db';
import { generateToken } from '../src/middleware/auth';

process.env.NODE_ENV = 'test';

beforeAll(() => {
  initDatabase(db);
});

beforeEach(() => {
  clearDatabase(db);
  initDatabase(db);
});

afterAll(() => {
  clearDatabase(db);
});

export function getAuthToken(role: 'admin' | 'executor' | 'supervisor' | 'executor2'): string {
  const userMap: Record<string, { userId: number; username: string; role: 'admin' | 'executor' | 'supervisor' }> = {
    admin: { userId: 1, username: 'admin', role: 'admin' },
    executor: { userId: 2, username: 'executor', role: 'executor' },
    executor2: { userId: 3, username: 'executor2', role: 'executor' },
    supervisor: { userId: 4, username: 'supervisor', role: 'supervisor' },
  };
  return generateToken(userMap[role]);
}

export function authHeader(role: 'admin' | 'executor' | 'supervisor' | 'executor2') {
  return { Authorization: `Bearer ${getAuthToken(role)}` };
}

export { app, request, db };
