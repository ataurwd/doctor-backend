const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const API_SECRET_KEY = process.env.API_SECRET_KEY || 'sajib-api-shield-9f4a8b1c7e2d6305a4f78e1b52a1c0de';
const CLIENT_TOKEN = process.env.CLIENT_HANDSHAKE_TOKEN || 'sajib-client-handshake-2026';
const JWT_SECRET = process.env.JWT_SECRET || 'dr-sajib-rheumatology-jwt-secret-key-2026';

// Allowed client origins
function getAllowedOrigins() {
  const custom = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/$/, '')] : [];
  return [
    ...custom,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
  ];
}

// 1. Direct API Access Guard
// Protects the API from raw direct external calls (e.g. bots, scrapers, unauthorized curl/postman)
function apiGuard(req, res, next) {
  // Allow health check endpoint
  if (req.path === '/api/health' || req.path === '/health') {
    return next();
  }

  // Preflight OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    return next();
  }

  // 1. Check server-to-server secret (Next.js SSR fetch)
  const incomingSecret = req.headers['x-api-secret'];
  if (incomingSecret && incomingSecret === API_SECRET_KEY) {
    return next();
  }

  // 2. Check for valid JWT Bearer Token (Authenticated Admin requests)
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded._id) {
        req.user = decoded;
        return next();
      }
    } catch (e) {
      // Invalid token, fall through to origin checks or reject
    }
  }

  // 3. Check for authorized frontend client origin & handshake header (Browser AJAX requests)
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  const clientToken = req.headers['x-app-client'];
  const requestedWith = req.headers['x-requested-with'];
  const allowed = getAllowedOrigins();

  const isOriginAllowed = origin && allowed.some((a) => origin.startsWith(a));
  const isRefererAllowed = referer && allowed.some((a) => referer.startsWith(a));
  const hasClientProof = clientToken === CLIENT_TOKEN || requestedWith === 'XMLHttpRequest';

  if ((isOriginAllowed || isRefererAllowed) && hasClientProof) {
    return next();
  }

  // If request also comes from local browser on development environment with valid origin
  if (process.env.NODE_ENV !== 'production' && (isOriginAllowed || isRefererAllowed)) {
    return next();
  }

  // Block unauthorized direct access
  console.warn(`[Security Alert] Blocked unauthorized direct API access: ${req.method} ${req.originalUrl} from IP: ${req.ip} | Origin: ${origin || 'none'}`);
  return res.status(403).json({
    error: 'Forbidden',
    message: 'Direct unauthorized API access is prohibited. All requests must originate from the authorized application.',
  });
}

// 2. Strict Rate Limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Please try again after 15 minutes to prevent unauthorized access.',
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please slow down.',
  },
});

// 3. NoSQL Injection Sanitization
function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(value)) {
      // Strip keys starting with $ (MongoDB query operators) or containing . (path traversal)
      if (k.startsWith('$') || k.includes('.')) {
        console.warn(`[Security Alert] Stripped potentially malicious NoSQL query key: ${k}`);
        continue;
      }
      clean[k] = sanitizeValue(v);
    }
    return clean;
  }
  return value;
}

function mongoSanitize(req, res, next) {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
}

module.exports = {
  apiGuard,
  loginLimiter,
  apiLimiter,
  mongoSanitize,
  getAllowedOrigins,
  API_SECRET_KEY,
  CLIENT_TOKEN,
};

