import request from 'supertest';
import { Express } from 'express';
import { generateToken } from '../src/middleware/auth';
import { getDb, resetDb, seedTestData } from '../src/db';

process.env.NODE_ENV = 'test';

export function createTestApp(): Express {
  resetDb();
  const { createApp } = require('../src/server');
  return createApp();
}

export function getToken(role: 'admin' | 'executor' | 'executor2' | 'supervisor'): string {
  const userMap: Record<string, { userId: number; username: string; role: 'admin' | 'executor' | 'supervisor' }> = {
    admin: { userId: 1, username: 'admin', role: 'admin' },
    executor: { userId: 2, username: 'executor', role: 'executor' },
    executor2: { userId: 3, username: 'executor2', role: 'executor' },
    supervisor: { userId: 4, username: 'supervisor', role: 'supervisor' },
  };
  return generateToken(userMap[role]);
}

export function resetTestData() {
  seedTestData();
}

export { request };
