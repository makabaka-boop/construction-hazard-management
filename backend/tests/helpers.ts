import jwt from 'jsonwebtoken';

const JWT_SECRET = 'construction-hazard-secret-key-2024';

export type TestRole = 'admin' | 'executor' | 'supervisor';

export function makeToken(role: TestRole, userId = 1, username = role): string {
  return jwt.sign({ userId, username, role }, JWT_SECRET, { expiresIn: '1h' });
}

export function authHeader(role: TestRole, userId = 1): { Authorization: string } {
  return { Authorization: `Bearer ${makeToken(role, userId, role)}` };
}
