afterAll(async () => {
  try {
    const db = require('../src/db').default;
    if (db && typeof db.close === 'function') {
      db.close();
    }
  } catch {}
});
