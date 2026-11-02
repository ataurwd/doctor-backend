require('dotenv').config();
const { connectDB, repo } = require('../db');

async function main() {
  await connectDB();
  await repo.resetAndSeed();
  console.log('Database seeded successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

