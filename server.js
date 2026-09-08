import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './src/routes/auth.js';
import registrationRoutes from './src/routes/registrations.js';
import churchRoutes from './src/routes/churches.js';
import churchPortalRoutes from './src/routes/churchPortal.js';
import uniformRoutes from './src/routes/uniforms.js';
import notificationRoutes from './src/routes/notifications.js';
import clubRoutes from './src/routes/club.js';
import publicRoutes from './src/routes/public.js';
import userPortalRoutes from './src/routes/userPortal.js';

const app = express();
const port = Number(process.env.PORT || 5000);

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, curl, mobile, or any web client origin
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'pathfinder-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/churches', churchRoutes);
app.use('/api/church-portal', churchPortalRoutes);
app.use('/api/uniforms', uniformRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', clubRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/user', userPortalRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

app.listen(port, () => {
  console.log(`Pathfinder API running on http://localhost:${port}`);
});
