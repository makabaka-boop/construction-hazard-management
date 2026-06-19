process.env.NODE_ENV = 'test';

import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = 'construction-hazard-secret-key-2024';

export function createTestDatabase(): Database.Database {
  const db = new Database(':memory:');
  
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'executor', 'supervisor')),
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS floors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, code)
    );

    CREATE TABLE IF NOT EXISTS areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      floor_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE,
      UNIQUE(floor_id, code)
    );

    CREATE TABLE IF NOT EXISTS hazard_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (parent_id) REFERENCES hazard_types(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS responsibility_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      leader TEXT NOT NULL,
      phone TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS hazard_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      floor_id INTEGER NOT NULL,
      area_id INTEGER NOT NULL,
      hazard_type_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      photos TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'rectifying', 'closed')),
      executor_id INTEGER NOT NULL,
      supervisor_id INTEGER,
      rectification_desc TEXT,
      rectification_photos TEXT,
      review_comment TEXT,
      deadline_date TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      rectified_at TEXT,
      closed_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (floor_id) REFERENCES floors(id),
      FOREIGN KEY (area_id) REFERENCES areas(id),
      FOREIGN KEY (hazard_type_id) REFERENCES hazard_types(id),
      FOREIGN KEY (group_id) REFERENCES responsibility_groups(id),
      FOREIGN KEY (executor_id) REFERENCES users(id),
      FOREIGN KEY (supervisor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS rectification_deadline_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hazard_type_parent_id INTEGER NOT NULL,
      default_days INTEGER NOT NULL DEFAULT 7,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (hazard_type_parent_id) REFERENCES hazard_types(id) ON DELETE CASCADE,
      UNIQUE(hazard_type_parent_id)
    );

    CREATE INDEX IF NOT EXISTS idx_hazard_project ON hazard_records(project_id);
    CREATE INDEX IF NOT EXISTS idx_hazard_floor ON hazard_records(floor_id);
    CREATE INDEX IF NOT EXISTS idx_hazard_area ON hazard_records(area_id);
    CREATE INDEX IF NOT EXISTS idx_hazard_type ON hazard_records(hazard_type_id);
    CREATE INDEX IF NOT EXISTS idx_hazard_group ON hazard_records(group_id);
    CREATE INDEX IF NOT EXISTS idx_hazard_status ON hazard_records(status);
  `);

  return db;
}

export function seedTestData(db: Database.Database) {
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)
  `);
  insertUser.run('admin', 'admin123', 'admin', '系统管理员');
  insertUser.run('executor', 'exec123', 'executor', '张三');
  insertUser.run('executor2', 'exec123', 'executor', '李四');
  insertUser.run('supervisor', 'super123', 'supervisor', '王监督');

  const users = db.prepare('SELECT * FROM users').all() as any[];
  
  return {
    admin: users.find(u => u.username === 'admin')!,
    executor: users.find(u => u.username === 'executor')!,
    executor2: users.find(u => u.username === 'executor2')!,
    supervisor: users.find(u => u.username === 'supervisor')!,
  };
}

export function seedBasicData(db: Database.Database) {
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

export function generateToken(userId: number, username: string, role: string): string {
  return jwt.sign({ userId, username, role }, JWT_SECRET, { expiresIn: '1h' });
}

export function createTestAppWithRouters(routers: { path: string; router: any }[]): express.Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  routers.forEach(({ path, router }) => {
    app.use(path, router);
  });

  return app;
}

export function setupTestEnv() {
  const db = createTestDatabase();
  const users = seedTestData(db);
  const basic = seedBasicData(db);

  jest.resetModules();
  jest.doMock('../src/db', () => ({ __esModule: true, default: db }));

  return { db, users, basic };
}

export function teardownTestEnv(db: Database.Database) {
  db.close();
  jest.dontMock('../src/db');
}
