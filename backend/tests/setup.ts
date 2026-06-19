import Database from 'better-sqlite3';
import { initDatabase } from '../src/db';

process.env.NODE_ENV = 'test';

let testDb: Database.Database | null = null;

export function setupTestDb(): Database.Database {
  testDb = new Database(':memory:');
  return initDatabase(testDb);
}

export function getTestDb(): Database.Database {
  if (!testDb) {
    return setupTestDb();
  }
  return testDb;
}

export function teardownTestDb(): void {
  if (testDb) {
    testDb.close();
    testDb = null;
  }
}

export function clearTables(db: Database.Database): void {
  db.exec(`
    DELETE FROM hazard_records;
    DELETE FROM rectification_deadline_rules;
    DELETE FROM areas;
    DELETE FROM floors;
    DELETE FROM hazard_types;
    DELETE FROM responsibility_groups;
    DELETE FROM projects;
    DELETE FROM users;
  `);
  
  db.exec(`
    DELETE FROM sqlite_sequence WHERE name IN (
      'hazard_records', 'rectification_deadline_rules', 'areas', 
      'floors', 'hazard_types', 'responsibility_groups', 'projects', 'users'
    );
  `);
}

export function seedTestData(db: Database.Database): {
  adminToken: string;
  executorToken: string;
  executor2Token: string;
  supervisorToken: string;
  adminUser: any;
  executorUser: any;
  executor2User: any;
  supervisorUser: any;
} {
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = 'construction-hazard-secret-key-2024';

  const insertUser = db.prepare(`
    INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)
  `);
  
  insertUser.run('admin', 'admin123', 'admin', '系统管理员');
  insertUser.run('executor', 'exec123', 'executor', '张三');
  insertUser.run('executor2', 'exec123', 'executor', '李四');
  insertUser.run('supervisor', 'super123', 'supervisor', '王监督');

  const users = db.prepare('SELECT * FROM users').all() as any[];
  const adminUser = users.find(u => u.username === 'admin')!;
  const executorUser = users.find(u => u.username === 'executor')!;
  const executor2User = users.find(u => u.username === 'executor2')!;
  const supervisorUser = users.find(u => u.username === 'supervisor')!;

  const generateToken = (userId: number, username: string, role: string) => 
    jwt.sign({ userId, username, role }, JWT_SECRET, { expiresIn: '1h' });

  return {
    adminToken: generateToken(adminUser.id, adminUser.username, adminUser.role),
    executorToken: generateToken(executorUser.id, executorUser.username, executorUser.role),
    executor2Token: generateToken(executor2User.id, executor2User.username, executor2User.role),
    supervisorToken: generateToken(supervisorUser.id, supervisorUser.username, supervisorUser.role),
    adminUser,
    executorUser,
    executor2User,
    supervisorUser,
  };
}

export function seedBasicData(db: Database.Database): {
  projectId: number;
  floorId: number;
  areaId: number;
  hazardTypeId: number;
  hazardTypeParentId: number;
  groupId: number;
} {
  const insertProject = db.prepare('INSERT INTO projects (name, code) VALUES (?, ?)');
  const projectResult = insertProject.run('测试项目', 'TEST001');
  const projectId = Number(projectResult.lastInsertRowid);

  const insertFloor = db.prepare('INSERT INTO floors (project_id, name, code) VALUES (?, ?, ?)');
  const floorResult = insertFloor.run(projectId, '1层', 'F01');
  const floorId = Number(floorResult.lastInsertRowid);

  const insertArea = db.prepare('INSERT INTO areas (floor_id, name, code) VALUES (?, ?, ?)');
  const areaResult = insertArea.run(floorId, '东区', 'A01');
  const areaId = Number(areaResult.lastInsertRowid);

  const insertHazardTypeParent = db.prepare('INSERT INTO hazard_types (parent_id, name, code) VALUES (?, ?, ?)');
  const parentResult = insertHazardTypeParent.run(null, '安全防护', 'HT01');
  const hazardTypeParentId = Number(parentResult.lastInsertRowid);

  const insertHazardType = db.prepare('INSERT INTO hazard_types (parent_id, name, code) VALUES (?, ?, ?)');
  const typeResult = insertHazardType.run(hazardTypeParentId, '临边防护', 'HT01-01');
  const hazardTypeId = Number(typeResult.lastInsertRowid);

  const insertGroup = db.prepare('INSERT INTO responsibility_groups (name, leader, phone) VALUES (?, ?, ?)');
  const groupResult = insertGroup.run('测试班组', '测试组长', '13800000000');
  const groupId = Number(groupResult.lastInsertRowid);

  return { projectId, floorId, areaId, hazardTypeId, hazardTypeParentId, groupId };
}
