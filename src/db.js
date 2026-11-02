const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const models = require('./models');
const { getInitialSeedData } = require('./seed/seedData');

const DATA_FILE = path.join(__dirname, '..', 'data', 'database.json');

let isMongoConnected = false;
let fileStore = null;

function ensureFileStore() {
  if (fileStore) return fileStore;
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(DATA_FILE)) {
    try {
      fileStore = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return fileStore;
    } catch (e) {
      console.warn('Re-initializing local database.json store...');
    }
  }
  fileStore = getInitialSeedData();
  saveFileStore();
  return fileStore;
}

function saveFileStore() {
  if (!fileStore) return;
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(fileStore, null, 2), 'utf8');
}

async function seedMongoIfNeeded() {
  // Ultra-fast check: if users collection has documents, the DB is already initialized!
  // Skipping 10 sequential count queries cuts cold start connection time by ~1.5 seconds!
  const userCount = await models.User.countDocuments();
  if (userCount > 0) return;

  const seed = getInitialSeedData();

  await models.User.insertMany(seed.users.map(({ _id, ...rest }) => rest));
  if ((await models.Doctor.countDocuments()) === 0) {
    await models.Doctor.insertMany(seed.doctors.map(({ _id, ...rest }) => rest));
  }
  if ((await models.Chamber.countDocuments()) === 0) {
    await models.Chamber.insertMany(seed.chambers.map(({ _id, ...rest }) => rest));
  }
  if ((await models.Speciality.countDocuments()) === 0) {
    await models.Speciality.insertMany(seed.specialities.map(({ _id, ...rest }) => rest));
  }
  if ((await models.SpecialService.countDocuments()) === 0) {
    await models.SpecialService.insertMany(seed.specialServices.map(({ _id, ...rest }) => rest));
  }
  if ((await models.Category.countDocuments()) === 0) {
    await models.Category.insertMany(seed.categories.map(({ _id, ...rest }) => rest));
  }
  if ((await models.Post.countDocuments()) === 0) {
    await models.Post.insertMany(seed.posts.map(({ _id, ...rest }) => rest));
  }
  if ((await models.Handout.countDocuments()) === 0) {
    await models.Handout.insertMany(seed.handouts.map(({ _id, ...rest }) => rest));
  }
  if ((await models.Faq.countDocuments()) === 0) {
    await models.Faq.insertMany(seed.faqs.map(({ _id, ...rest }) => rest));
  }
  if ((await models.Setting.countDocuments()) === 0) {
    await models.Setting.insertMany(seed.settings);
  }
}

let cachedPromise = null;

async function connectDB() {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    isMongoConnected = true;
    return mongoose.connection;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dr_sajib';
  cachedPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      minPoolSize: 2,
    })
    .then(async (m) => {
      isMongoConnected = true;
      console.log(`[DB] Connected to MongoDB at ${uri}`);
      await seedMongoIfNeeded();
      return m;
    })
    .catch((err) => {
      cachedPromise = null;
      isMongoConnected = false;
      console.log(
        `[DB] Local MongoDB service (${uri}) not detected (${err.message}). Using Mongoose-compatible persistent JSON document store at data/database.json.`
      );
      ensureFileStore();
    });

  return cachedPromise;
}

const COLLECTION_MAP = {
  users: 'User',
  doctors: 'Doctor',
  chambers: 'Chamber',
  specialities: 'Speciality',
  specialServices: 'SpecialService',
  categories: 'Category',
  posts: 'Post',
  handouts: 'Handout',
  faqs: 'Faq',
  appointmentRequests: 'AppointmentRequest',
  contactMessages: 'ContactMessage',
  settings: 'Setting',
};

function matchesFilter(doc, filter = {}) {
  for (const [k, v] of Object.entries(filter)) {
    if (v === undefined) continue;
    if (k === '_id' || k === 'id') {
      if (String(doc._id || doc.id) !== String(v)) return false;
    } else if (doc[k] !== v) {
      return false;
    }
  }
  return true;
}

function sortItems(items, sort = {}) {
  const entries = Object.entries(sort);
  if (entries.length === 0) return items;
  return [...items].sort((a, b) => {
    for (const [field, dir] of entries) {
      const av = a[field];
      const bv = b[field];
      if (av === bv) continue;
      const cmp = av > bv ? 1 : -1;
      return dir === -1 || dir === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
}

const repo = {
  isMongo: () => isMongoConnected,

  async find(collection, filter = {}, sort = {}) {
    if (isMongoConnected) {
      const Model = models[COLLECTION_MAP[collection]];
      return await Model.find(filter).sort(sort).lean();
    }
    const store = ensureFileStore();
    const list = (store[collection] || []).filter((item) => matchesFilter(item, filter));
    return sortItems(list, sort);
  },

  async findOne(collection, filter = {}) {
    if (isMongoConnected) {
      const Model = models[COLLECTION_MAP[collection]];
      return await Model.findOne(filter).lean();
    }
    const store = ensureFileStore();
    return (store[collection] || []).find((item) => matchesFilter(item, filter)) || null;
  },

  async findById(collection, id) {
    if (isMongoConnected) {
      const Model = models[COLLECTION_MAP[collection]];
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      return await Model.findById(id).lean();
    }
    const store = ensureFileStore();
    return (store[collection] || []).find((item) => String(item._id) === String(id)) || null;
  },

  async create(collection, data) {
    if (isMongoConnected) {
      const Model = models[COLLECTION_MAP[collection]];
      const created = await Model.create(data);
      return created.toObject();
    }
    const store = ensureFileStore();
    if (!store[collection]) store[collection] = [];
    const now = new Date().toISOString();
    const doc = {
      _id: data._id || `${collection.slice(0, 4)}_${crypto.randomBytes(6).toString('hex')}`,
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };
    store[collection].push(doc);
    saveFileStore();
    return doc;
  },

  async updateById(collection, id, updates) {
    if (isMongoConnected) {
      const Model = models[COLLECTION_MAP[collection]];
      return await Model.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    }
    const store = ensureFileStore();
    const list = store[collection] || [];
    const idx = list.findIndex((item) => String(item._id) === String(id));
    if (idx === -1) return null;
    const updated = {
      ...list[idx],
      ...updates,
      _id: list[idx]._id,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    saveFileStore();
    return updated;
  },

  async deleteById(collection, id) {
    if (isMongoConnected) {
      const Model = models[COLLECTION_MAP[collection]];
      const res = await Model.findByIdAndDelete(id);
      return !!res;
    }
    const store = ensureFileStore();
    const list = store[collection] || [];
    const idx = list.findIndex((item) => String(item._id) === String(id));
    if (idx === -1) return false;
    list.splice(idx, 1);
    saveFileStore();
    return true;
  },

  async getSettingsMap() {
    const items = await this.find('settings');
    const map = {};
    for (const item of items) {
      map[item.key] = item.value ?? '';
    }
    return map;
  },

  async updateSettingsMap(newSettings = {}) {
    if (isMongoConnected) {
      for (const [key, value] of Object.entries(newSettings)) {
        await models.Setting.findOneAndUpdate(
          { key },
          { $set: { value: String(value ?? '') } },
          { upsert: true, new: true }
        );
      }
      return await this.getSettingsMap();
    }
    const store = ensureFileStore();
    if (!store.settings) store.settings = [];
    for (const [key, value] of Object.entries(newSettings)) {
      const existing = store.settings.find((s) => s.key === key);
      if (existing) {
        existing.value = String(value ?? '');
      } else {
        store.settings.push({ key, value: String(value ?? '') });
      }
    }
    saveFileStore();
    return await this.getSettingsMap();
  },

  async resetAndSeed() {
    const seed = getInitialSeedData();
    if (isMongoConnected) {
      for (const modelName of Object.values(COLLECTION_MAP)) {
        await models[modelName].deleteMany({});
      }
      await seedMongoIfNeeded();
      return;
    }
    fileStore = seed;
    saveFileStore();
  },
};

module.exports = { connectDB, repo };

