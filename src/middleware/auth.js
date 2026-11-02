const jwt = require('jsonwebtoken');
const { repo } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'dr-sajib-rheumatology-jwt-secret-key-2026';

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded._id) {
      return res.status(401).json({ error: 'Invalid authentication token.' });
    }

    // Verify user still exists in the active database
    const user = await repo.findById('users', decoded._id);
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists or was deactivated.' });
    }

    req.user = {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, JWT_SECRET };
