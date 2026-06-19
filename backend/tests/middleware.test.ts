import jwt from 'jsonwebtoken';
import { generateToken, authMiddleware, roleMiddleware } from '../src/middleware/auth';

const JWT_SECRET = 'construction-hazard-secret-key-2024';

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('auth middleware unit', () => {
  it('generateToken returns a verifiable JWT', () => {
    const token = generateToken({ userId: 1, username: 'admin', role: 'admin' });
    const decoded: any = jwt.verify(token, JWT_SECRET);
    expect(decoded.role).toBe('admin');
    expect(decoded.userId).toBe(1);
  });

  it('authMiddleware: no header returns 401', () => {
    const req: any = { headers: {} };
    const res = mockRes();
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('authMiddleware: bad scheme returns 401', () => {
    const req: any = { headers: { authorization: 'Token abc' } };
    const res = mockRes();
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('authMiddleware: invalid token returns 401', () => {
    const req: any = { headers: { authorization: 'Bearer abc' } };
    const res = mockRes();
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('authMiddleware: valid token attaches user and calls next', () => {
    const token = generateToken({ userId: 7, username: 'foo', role: 'executor' });
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.userId).toBe(7);
  });

  it('roleMiddleware: rejects non-matching role', () => {
    const mw = roleMiddleware(['admin']);
    const req: any = { user: { userId: 1, username: 'x', role: 'executor' } };
    const res = mockRes();
    const next = jest.fn();
    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('roleMiddleware: passes matching role', () => {
    const mw = roleMiddleware(['admin', 'executor']);
    const req: any = { user: { userId: 1, username: 'x', role: 'executor' } };
    const res = mockRes();
    const next = jest.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
