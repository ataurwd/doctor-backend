require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { connectDB } = require('./db');
const {
  apiGuard,
  mongoSanitize,
  apiLimiter,
  getAllowedOrigins,
  isOriginAllowed,
} = require('./middleware/security');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. HTTP Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Served as an API backend; frontend manages its own CSP
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'deny' }, // Anti-clickjacking
    hidePoweredBy: true, // Do not advertise Express
  })
);

// 2. Strict CORS Policy
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. server-side Next.js, mobile apps, or local curl with secret)
      if (!origin || isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`[Security Alert] Blocked by CORS: Origin ${origin} is not allowed.`);
        callback(new Error('Cross-Origin Request Blocked by Security Policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-api-secret',
      'x-app-client',
      'x-requested-with',
    ],
  })
);

// Ensure MongoDB connection is ready on every request (essential for Vercel Serverless Functions)
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.warn('[DB Error]', err.message);
  }
  next();
});

// 3. Body Parser with Safe Size Limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. NoSQL Injection Sanitization
app.use(mongoSanitize);

// 5. Global API Rate Limiting
app.use('/api', apiLimiter);

// 6. Direct Unauthorized API Access Shield
app.use('/api', apiGuard);

// 7. Static handouts (served safely)
app.use('/handouts', express.static(path.join(__dirname, '..', 'public', 'handouts')));

// 8. Health check endpoint (for monitoring/diagnostics)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'dr-sajib-backend',
    timestamp: new Date().toISOString(),
  });
});

// 9. API Routes
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', adminRoutes); // Alias for auth routes (/api/auth/login, /api/auth/me)

// 10. Global 404 Handler for Unrecognized API Routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// 11. Secure Global Error Handler (Hides Internal Stack Traces in Responses)
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err.message);
  if (err.message === 'Cross-Origin Request Blocked by Security Policy') {
    return res.status(403).json({ error: 'Forbidden', message: err.message });
  }
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
});

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[Server] Dr. Sajib Secure Node + MongoDB Backend listening on http://localhost:${PORT}`);
  });
}

// Standalone listener when run directly (e.g. node src/server.js)
if (require.main === module) {
  start();
}

module.exports = app;
