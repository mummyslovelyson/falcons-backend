import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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

// Trust first proxy (Render, Vercel, Cloudflare, etc.) for accurate IP-based rate limiting
app.set('trust proxy', 1);

// Security Headers with Cross-Origin Resource Policy enabled for Vercel client
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
}));

// CORS Configuration
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

// Global Rate Limiter: 500 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again in 15 minutes.' },
});
app.use('/api', apiLimiter);

// Strict Auth Limiter: 20 login/auth attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again in 15 minutes.' },
});
app.use('/api/auth', authLimiter);
app.use('/api/user/login', authLimiter);
app.use('/api/church-portal/login', authLimiter);

// Intake Limiter: 30 registration submissions per hour per IP
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Registration submission limit reached for this hour. Please try again later.' },
});
app.use('/api/registrations', registrationLimiter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'pathfinder-backend',
    database: process.env.DATABASE_URL ? 'configured' : 'missing',
    version: '2.0-postgres-secured',
  });
});

// Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/churches', churchRoutes);
app.use('/api/church-portal', churchPortalRoutes);
app.use('/api/uniforms', uniformRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', clubRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/user', userPortalRoutes);

// Centralized Secure Error Handler
app.use((err, _req, res, _next) => {
  // Payload too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request payload or uploaded file exceeds the 15MB limit.' });
  }

  // Postgres unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({ message: 'A record with this unique identifier already exists.' });
  }

  // Log error details on server only
  console.error('[Backend Error]:', err);

  const isProd = process.env.NODE_ENV === 'production';
  const statusCode = err.status || err.statusCode || 500;
  
  res.status(statusCode).json({
    message: isProd && statusCode === 500 ? 'An unexpected server error occurred.' : (err.message || 'Server error'),
    ...(!isProd && { stack: err.stack }),
  });
});

app.listen(port, () => {
  console.log(`Pathfinder API running on http://localhost:${port}`);
});
