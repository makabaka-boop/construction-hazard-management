import app from './app';
import './db';

const PORT = 8031;

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
