import path from 'path';
import os from 'os';

const tmpDir = path.join(os.tmpdir(), 'hazard-tests');
process.env.HAZARD_DB_PATH = path.join(tmpDir, `test-${process.pid}.db`);
process.env.NODE_ENV = 'test';
