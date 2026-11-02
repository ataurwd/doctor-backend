const express = require('express');
const rateLimit = require('express-rate-limit');
const { repo } = require('../db');
const { normalizePhone, isValidBangladeshPhone } = require('../utils/phone');

const router = express.Router();

const DAYS = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again in an hour or call the chamber directly.',
  },
});

async function attachPostRelations(post, categories, handouts) {
  const category = categories.find((c) => c.slug === post.category_slug) || null;
  const postHandouts = handouts.filter((h) => h.post_slug === post.slug && h.is_published);
  return {
    ...post,
    category,
    handouts: postHandouts,
  };
}

// Site-wide bootstrap data (doctor, active chambers, settings, latest posts, faqs, categories)
router.get('/bootstrap', async (req, res) => {
  try {
    const doctors = await repo.find('doctors');
    const doctor = doctors[0] || null;
    const allChambers = await repo.find('chambers', {}, { sort_order: 1 });
    const chambers = allChambers.filter((c) => c.is_active);
    const settings = await repo.getSettingsMap();
    const categories = await repo.find('categories');
    const handouts = await repo.find('handouts');
    const allPosts = await repo.find('posts', {}, { published_at: -1 });
    const publishedPosts = await Promise.all(
      allPosts
        .filter((p) => p.is_published)
        .map((p) => attachPostRelations(p, categories, handouts))
    );
    const allFaqs = await repo.find('faqs', {}, { sort_order: 1 });
    const faqs = allFaqs.filter((f) => f.is_published);
    const allSpecs = await repo.find('specialities', {}, { sort_order: 1 });
    const specialities = allSpecs.filter((s) => s.is_published);
    const allServices = await repo.find('specialServices', {}, { sort_order: 1 });
    const specialServices = allServices.filter((s) => s.is_published);

    res.json({
      doctor,
      chambers,
      settings,
      categories,
      latestPosts: publishedPosts.slice(0, 3),
      faqs,
      specialities,
      specialServices,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load site data' });
  }
});

// Specialities
router.get('/specialities', async (req, res) => {
  try {
    const all = await repo.find('specialities', {}, { sort_order: 1 });
    res.json(all.filter((s) => s.is_published));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load specialities' });
  }
});

router.get('/specialities/:slug', async (req, res) => {
  try {
    const all = (await repo.find('specialities', {}, { sort_order: 1 })).filter((s) => s.is_published);
    const item = all.find((s) => s.slug === req.params.slug);
    if (!item) return res.status(404).json({ error: 'Speciality not found' });
    const others = all.filter((s) => s.slug !== req.params.slug);
    res.json({ item, others });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load speciality' });
  }
});

// Special Services
router.get('/services', async (req, res) => {
  try {
    const all = await repo.find('specialServices', {}, { sort_order: 1 });
    res.json(all.filter((s) => s.is_published));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load special services' });
  }
});

router.get('/services/:slug', async (req, res) => {
  try {
    const all = (await repo.find('specialServices', {}, { sort_order: 1 })).filter(
      (s) => s.is_published
    );
    const item = all.find((s) => s.slug === req.params.slug);
    if (!item) return res.status(404).json({ error: 'Special service not found' });
    const others = all.filter((s) => s.slug !== req.params.slug);
    res.json({ item, others });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load special service' });
  }
});

// Patient Education Posts (with search, category filter, pagination)
router.get('/posts', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const categorySlug = String(req.query.category || '').trim();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = 9;

    const categories = await repo.find('categories');
    const handouts = await repo.find('handouts');
    const allPosts = (await repo.find('posts', {}, { published_at: -1 })).filter(
      (p) => p.is_published
    );

    let filtered = allPosts;

    if (categorySlug) {
      filtered = filtered.filter((p) => p.category_slug === categorySlug);
    }

    if (q) {
      filtered = filtered.filter((p) => {
        const hay = [
          p.title?.en,
          p.title?.bn,
          p.excerpt?.en,
          p.excerpt?.bn,
          p.body?.en,
          p.body?.bn,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const slice = filtered.slice((page - 1) * perPage, page * perPage);
    const posts = await Promise.all(slice.map((p) => attachPostRelations(p, categories, handouts)));
    const activeCategory = categorySlug
      ? categories.find((c) => c.slug === categorySlug) || null
      : null;

    res.json({
      posts,
      categories,
      activeCategory,
      q: String(req.query.q || '').trim(),
      pagination: {
        page,
        perPage,
        total,
        totalPages,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load posts' });
  }
});

router.get('/posts/:slug', async (req, res) => {
  try {
    const categories = await repo.find('categories');
    const handouts = await repo.find('handouts');
    const allPosts = (await repo.find('posts', {}, { published_at: -1 })).filter(
      (p) => p.is_published
    );
    const rawPost = allPosts.find((p) => p.slug === req.params.slug);
    if (!rawPost) return res.status(404).json({ error: 'Article not found' });

    const post = await attachPostRelations(rawPost, categories, handouts);
    const relatedRaw = allPosts
      .filter((p) => p.slug !== rawPost.slug && p.category_slug === rawPost.category_slug)
      .slice(0, 3);
    const related = await Promise.all(
      relatedRaw.map((p) => attachPostRelations(p, categories, handouts))
    );

    res.json({ post, related });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load article' });
  }
});

// Handouts
router.get('/handouts', async (req, res) => {
  try {
    const handouts = (await repo.find('handouts')).filter((h) => h.is_published);
    const posts = await repo.find('posts');
    const enriched = handouts.map((h) => ({
      ...h,
      post: posts.find((p) => p.slug === h.post_slug && p.is_published) || null,
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load handouts' });
  }
});

// Appointment submission
router.post('/appointments', submissionLimiter, async (req, res) => {
  try {
    const { website, name, phone, chamber_id, preferred_day, reason, consent, locale } =
      req.body || {};

    // Honeypot check: pretend success if filled
    if (website && String(website).trim() !== '') {
      return res.json({ ok: true });
    }

    const isBn = locale === 'bn';
    const errors = {};

    const cleanName = String(name || '').trim();
    if (!cleanName) {
      errors.name = isBn ? 'নাম লিখতে হবে।' : 'The name field is required.';
    } else if (cleanName.length > 120) {
      errors.name = isBn
        ? 'নাম ১২০ অক্ষরের বেশি হতে পারবে না।'
        : 'The name field must not be greater than 120 characters.';
    }

    const rawPhone = String(phone || '').trim();
    if (!rawPhone) {
      errors.phone = isBn ? 'ফোন নম্বর লিখতে হবে।' : 'The phone number field is required.';
    } else if (!isValidBangladeshPhone(rawPhone)) {
      errors.phone = isBn
        ? 'সঠিক বাংলাদেশি ফোন নম্বর লিখুন, যেমন ০১৭১১-১২৩৪৫৬।'
        : 'Please enter a valid Bangladesh phone number, for example 01711-123456.';
    }

    if (chamber_id) {
      const chamber = await repo.findById('chambers', chamber_id);
      if (!chamber || !chamber.is_active) {
        errors.chamber_id = isBn ? 'নির্বাচিত চেম্বার সঠিক নয়।' : 'The selected chamber is invalid.';
      }
    }

    if (preferred_day && !DAYS.includes(preferred_day)) {
      errors.preferred_day = isBn ? 'নির্বাচিত দিন সঠিক নয়।' : 'The selected day is invalid.';
    }

    const cleanReason = reason ? String(reason).trim() : '';
    if (cleanReason.length > 200) {
      errors.reason = isBn
        ? 'কারণ ২০০ অক্ষরের বেশি হতে পারবে না।'
        : 'The reason field must not be greater than 200 characters.';
    }

    if (!consent || consent === 'false' || consent === '0') {
      errors.consent = isBn
        ? 'চেম্বার থেকে কল করার সম্মতি দিতে ঘরে টিক দিন।'
        : 'Please tick the box to agree that the team may call you.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ errors });
    }

    const created = await repo.create('appointmentRequests', {
      name: cleanName,
      phone: normalizePhone(rawPhone),
      chamber_id: chamber_id || null,
      preferred_day: preferred_day || null,
      reason: cleanReason || null,
      consent: true,
      status: 'new',
      staff_note: '',
    });

    res.status(201).json({ ok: true, id: created._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit appointment request' });
  }
});

// Contact message submission
router.post('/contact', submissionLimiter, async (req, res) => {
  try {
    const { website, name, phone, email, message, locale } = req.body || {};

    if (website && String(website).trim() !== '') {
      return res.json({ ok: true });
    }

    const isBn = locale === 'bn';
    const errors = {};

    const cleanName = String(name || '').trim();
    if (!cleanName) {
      errors.name = isBn ? 'নাম লিখতে হবে।' : 'The name field is required.';
    } else if (cleanName.length > 120) {
      errors.name = isBn
        ? 'নাম ১২০ অক্ষরের বেশি হতে পারবে না।'
        : 'The name field must not be greater than 120 characters.';
    }

    const rawPhone = String(phone || '').trim();
    if (!rawPhone) {
      errors.phone = isBn ? 'ফোন নম্বর লিখতে হবে।' : 'The phone number field is required.';
    } else if (!isValidBangladeshPhone(rawPhone)) {
      errors.phone = isBn
        ? 'সঠিক বাংলাদেশি ফোন নম্বর লিখুন, যেমন ০১৭১১-১২৩৪৫৬।'
        : 'Please enter a valid Bangladesh phone number, for example 01711-123456.';
    }

    const cleanEmail = email ? String(email).trim() : '';
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = isBn ? 'সঠিক ইমেইল ঠিকানা লিখুন।' : 'Please enter a valid email address.';
    }

    const cleanMessage = String(message || '').trim();
    if (!cleanMessage) {
      errors.message = isBn ? 'বার্তা লিখতে হবে।' : 'The message field is required.';
    } else if (cleanMessage.length > 1000) {
      errors.message = isBn
        ? 'বার্তা ১০০০ অক্ষরের বেশি হতে পারবে না।'
        : 'The message field must not be greater than 1000 characters.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ errors });
    }

    const created = await repo.create('contactMessages', {
      name: cleanName,
      phone: normalizePhone(rawPhone),
      email: cleanEmail || null,
      message: cleanMessage,
      is_read: false,
    });

    res.status(201).json({ ok: true, id: created._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit contact message' });
  }
});

module.exports = router;

