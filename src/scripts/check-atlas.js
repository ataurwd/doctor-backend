require('dotenv').config();
const mongoose = require('mongoose');
const models = require('../models');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas successfully!');
  for (const [name, Model] of Object.entries(models)) {
    const count = await Model.countDocuments();
    console.log(`Model ${name}: ${count} docs`);
  }
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Atlas connection error:', err);
  process.exit(1);
});

