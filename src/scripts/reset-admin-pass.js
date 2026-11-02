require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { repo, connectDB } = require('../db');

async function main() {
  await connectDB();
  const hash = bcrypt.hashSync('admin123456', 10);

  const user = await repo.findOne('users', { email: 'admin@example.com' });
  if (user) {
    await repo.updateById('users', user._id, { password: hash });
    console.log('MongoDB: Admin password successfully reset to "admin123456" for email:', user.email);
  }

  const jsonDbPath = path.join(__dirname, '..', '..', 'data', 'database.json');
  if (fs.existsSync(jsonDbPath)) {
    const raw = JSON.parse(fs.readFileSync(jsonDbPath, 'utf8'));
    if (raw.users) {
      raw.users.forEach((u) => {
        if (u.email === 'admin@example.com') u.password = hash;
      });
      fs.writeFileSync(jsonDbPath, JSON.stringify(raw, null, 2), 'utf8');
      console.log('Local database.json: Admin password hash updated to "admin123456"');
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Error resetting password:', err);
  process.exit(1);
});

