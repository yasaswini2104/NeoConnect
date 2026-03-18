import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';
import userRoutes from './routes/users.js';
import pollRoutes from './routes/polls.js';
import publicHubRoutes from './routes/publicHub.js';
import analyticsRoutes from './routes/analytics.js';
import { startEscalationCron } from './utils/cron.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',        authRoutes);
app.use('/api/complaints',  complaintRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/polls',       pollRoutes);
app.use('/api/public-hub',  publicHubRoutes);
app.use('/api/analytics',   analyticsRoutes);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', message: 'NeoConnect API running' })
);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(` NeoConnect server running on port ${PORT}`);
    startEscalationCron();
  });
};

startServer();

export default app;
