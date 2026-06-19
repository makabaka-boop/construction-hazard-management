import fs from 'fs';
import path from 'path';
import os from 'os';

export default async function () {
  const tmpDir = path.join(os.tmpdir(), 'hazard-tests');
  if (fs.existsSync(tmpDir)) {
    for (const file of fs.readdirSync(tmpDir)) {
      try {
        fs.unlinkSync(path.join(tmpDir, file));
      } catch {}
    }
  }
}
