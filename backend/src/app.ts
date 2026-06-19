import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import executorRouter from './routes/executor';
import supervisorRouter from './routes/supervisor';
import commonRouter from './routes/common';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/executor', executorRouter);
app.use('/api/supervisor', supervisorRouter);
app.use('/api/common', commonRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
