const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { repo } = require('../db');
const { requireAuth, requireAdmin, JWT_SECRET } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/security');
const publicRoutes = require('./public');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 1. Admin Login (Protected by rate limiter against brute force & timing attack mitigation)
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const user = await repo.findOne('users', { email: cleanEmail });

    // Timing-attack mitigation: always perform bcrypt hash check
    const dummyHash = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';
    const hashToCompare = user ? user.password : dummyHash;
    const isPasswordValid = bcrypt.compareSync(String(password), hashToCompare);

    if (!user || !isPasswordValid) {
      console.warn(`[Security Audit] Failed login attempt for: ${cleanEmail} from IP: ${req.ip}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log(`[Security Audit] Successful admin login: ${user.email} (${user.role}) from IP: ${req.ip}`);

    const token = jwt.sign(
      { _id: user._id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[Admin Login Error]', err);
    res.status(500).json({ error: 'Login service encountered an unexpected error.' });
  }
});

// 2. Get current authenticated user
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// 3. Dashboard stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const appointments = await repo.find('appointmentRequests', {}, { createdAt: -1 });
    const messages = await repo.find('contactMessages', {}, { createdAt: -1 });
    const chambers = await repo.find('chambers');
    const posts = await repo.find('posts');
    const specialities = await repo.find('specialities');
    const services = await repo.find('specialServices');
    const faqs = await repo.find('faqs');
    const doctors = await repo.find('doctors');

    const reviewPendingCount =
      doctors.filter((d) => d.review_note).length +
      chambers.filter((c) => c.verify_note).length +
      specialities.filter((s) => s.review_note).length +
      services.filter((s) => s.review_note).length +
      posts.filter((p) => p.review_note).length +
      faqs.filter((f) => f.review_note).length;

    res.json({
      newAppointments: appointments.filter((a) => a.status === 'new').length,
      totalAppointments: appointments.length,
      unreadMessages: messages.filter((m) => !m.is_read).length,
      totalMessages: messages.length,
      activeChambers: chambers.filter((c) => c.is_active).length,
      totalChambers: chambers.length,
      publishedPosts: posts.filter((p) => p.is_published).length,
      reviewPendingCount,
      recentAppointments: appointments.slice(0, 5),
      dbMode: repo.isMongo() ? 'MongoDB (Atlas Mongoose)' : 'MongoDB Persistent Store (JSON)',
    });
  } catch (err) {
    console.error('[Admin Stats Error]', err);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
});

// 4. Settings (Admin only for updates)
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const map = await repo.getSettingsMap();
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

router.put('/settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updated = await repo.updateSettingsMap(req.body || {});
    if (publicRoutes.clearPublicCache) publicRoutes.clearPublicCache();
    console.log(`[Security Audit] Settings updated by ${req.user.email}`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// 5. Appointment quick action: Mark as called
router.patch('/appointment-requests/:id/mark-called', requireAuth, async (req, res) => {
  try {
    const updated = await repo.updateById('appointmentRequests', req.params.id, {
      status: 'called',
    });
    if (!updated) return res.status(404).json({ error: 'Appointment not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
});

// 6. Contact message quick action: Toggle read
router.patch('/contact-messages/:id/toggle-read', requireAuth, async (req, res) => {
  try {
    const existing = await repo.findById('contactMessages', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Message not found' });
    const updated = await repo.updateById('contactMessages', req.params.id, {
      is_read: !existing.is_read,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// 7. Users Management (Admin Role Required)
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await repo.find('users');
    res.json(users.map(({ password, ...u }) => u));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const existing = await repo.findOne('users', { email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'A user with this email address already exists' });
    }

    const created = await repo.create('users', {
      name: cleanName,
      email: cleanEmail,
      password: bcrypt.hashSync(String(password), 10),
      role: role === 'admin' ? 'admin' : 'editor',
    });

    console.log(`[Security Audit] User created: ${cleanEmail} (${created.role}) by ${req.user.email}`);
    const { password: _, ...safe } = created;
    res.status(201).json(safe);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    const updates = {};

    if (name) updates.name = String(name).trim();
    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!EMAIL_REGEX.test(cleanEmail)) {
        return res.status(400).json({ error: 'Invalid email address format' });
      }
      const existing = await repo.findOne('users', { email: cleanEmail });
      if (existing && String(existing._id) !== String(req.params.id)) {
        return res.status(409).json({ error: 'Email already in use by another account' });
      }
      updates.email = cleanEmail;
    }

    if (role) {
      // If demoting from admin to editor, make sure there is at least one other admin
      if (role === 'editor') {
        const target = await repo.findById('users', req.params.id);
        if (target && target.role === 'admin') {
          const admins = (await repo.find('users')).filter((u) => u.role === 'admin');
          if (admins.length <= 1) {
            return res.status(400).json({ error: 'Cannot demote the only administrator account.' });
          }
        }
      }
      updates.role = role === 'admin' ? 'admin' : 'editor';
    }

    if (password && String(password).trim() !== '') {
      if (String(password).length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }
      updates.password = bcrypt.hashSync(String(password), 10);
    }

    const updated = await repo.updateById('users', req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'User not found' });

    console.log(`[Security Audit] User ${req.params.id} updated by ${req.user.email}`);
    const { password: _, ...safe } = updated;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    // 1. Prevent self-deletion
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ error: 'Security policy: You cannot delete your own account.' });
    }

    // 2. Prevent deleting the last administrator
    const target = await repo.findById('users', req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (target.role === 'admin') {
      const admins = (await repo.find('users')).filter((u) => u.role === 'admin');
      if (admins.length <= 1) {
        return res.status(400).json({ error: 'Cannot delete the only administrator account.' });
      }
    }

    await repo.deleteById('users', req.params.id);
    console.log(`[Security Audit] User ${target.email} deleted by ${req.user.email}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// 8. Generic CRUD for content & inbox collections (Requires Authentication)
const RESOURCE_MAP = {
  doctors: { collection: 'doctors', sort: {} },
  chambers: { collection: 'chambers', sort: { sort_order: 1 } },
  specialities: { collection: 'specialities', sort: { sort_order: 1 } },
  'special-services': { collection: 'specialServices', sort: { sort_order: 1 } },
  categories: { collection: 'categories', sort: {} },
  posts: { collection: 'posts', sort: { published_at: -1 } },
  handouts: { collection: 'handouts', sort: {} },
  faqs: { collection: 'faqs', sort: { sort_order: 1 } },
  'appointment-requests': { collection: 'appointmentRequests', sort: { createdAt: -1 } },
  'contact-messages': { collection: 'contactMessages', sort: { createdAt: -1 } },
};

Object.entries(RESOURCE_MAP).forEach(([routeKey, { collection, sort }]) => {
  router.get(`/${routeKey}`, requireAuth, async (req, res) => {
    try {
      const items = await repo.find(collection, {}, sort);
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: `Failed to list ${routeKey}` });
    }
  });

  router.get(`/${routeKey}/:id`, requireAuth, async (req, res) => {
    try {
      const item = await repo.findById(collection, req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: `Failed to get ${routeKey}` });
    }
  });

  router.post(`/${routeKey}`, requireAuth, async (req, res) => {
    try {
      const created = await repo.create(collection, req.body || {});
      if (publicRoutes.clearPublicCache) publicRoutes.clearPublicCache();
      console.log(`[Security Audit] Resource created in ${routeKey} by ${req.user.email}`);
      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: `Failed to create in ${routeKey}` });
    }
  });

  router.put(`/${routeKey}/:id`, requireAuth, async (req, res) => {
    try {
      const updated = await repo.updateById(collection, req.params.id, req.body || {});
      if (!updated) return res.status(404).json({ error: 'Not found' });
      if (publicRoutes.clearPublicCache) publicRoutes.clearPublicCache();
      console.log(`[Security Audit] Resource ${req.params.id} in ${routeKey} updated by ${req.user.email}`);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: `Failed to update ${routeKey}` });
    }
  });

  router.delete(`/${routeKey}/:id`, requireAuth, async (req, res) => {
    try {
      await repo.deleteById(collection, req.params.id);
      if (publicRoutes.clearPublicCache) publicRoutes.clearPublicCache();
      console.log(`[Security Audit] Resource ${req.params.id} in ${routeKey} deleted by ${req.user.email}`);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: `Failed to delete from ${routeKey}` });
    }
  });
});

module.exports = router;
