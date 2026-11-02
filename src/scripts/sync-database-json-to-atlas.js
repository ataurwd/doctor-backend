require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const models = require('../models');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'database.json');

async function sync() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI not found in .env');
  }

  console.log('[Sync] Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('[Sync] Connected successfully!');

  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`Data file not found at ${DATA_FILE}`);
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  const mapping = [
    { key: 'users', model: models.User, idField: 'email' },
    { key: 'doctors', model: models.Doctor, single: true },
    { key: 'chambers', model: models.Chamber, idField: 'sort_order' },
    { key: 'specialities', model: models.Speciality, idField: 'slug' },
    { key: 'specialServices', model: models.SpecialService, idField: 'slug' },
    { key: 'categories', model: models.Category, idField: 'slug' },
    { key: 'posts', model: models.Post, idField: 'slug' },
    { key: 'handouts', model: models.Handout },
    { key: 'faqs', model: models.Faq, idField: 'sort_order' },
    { key: 'settings', model: models.Setting, idField: 'key' },
  ];

  for (const { key, model, idField } of mapping) {
    const items = data[key];
    if (!items || !Array.isArray(items)) continue;

    console.log(`[Sync] Clearing and inserting ${items.length} items into ${model.modelName}...`);
    await model.deleteMany({});

    // Clean documents (strip custom non-ObjectId string _id so Mongoose auto-generates valid ObjectId)
    const docs = items.map(item => {
      const doc = { ...item };
      // If _id is not a valid 24-character hex ObjectId, delete it so Mongo assigns one
      if (doc._id && !mongoose.Types.ObjectId.isValid(doc._id)) {
        delete doc._id;
      }
      return doc;
    });

    if (docs.length > 0) {
      await model.insertMany(docs);
    }
    const count = await model.countDocuments();
    console.log(`[Sync] ${model.modelName} now has ${count} documents in MongoDB Atlas.`);
  }

  console.log('[Sync] All database.json data successfully sent to MongoDB Atlas!');
  await mongoose.disconnect();
}

sync().catch(err => {
  console.error('[Sync] Error:', err);
  process.exit(1);
});

