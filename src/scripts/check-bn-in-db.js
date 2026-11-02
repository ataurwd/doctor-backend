const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../../data/database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

for (const [key, val] of Object.entries(db)) {
  if (!Array.isArray(val)) continue;
  let countWithBn = 0;
  for (const item of val) {
    const jsonStr = JSON.stringify(item);
    if (/[\u0980-\u09FF]/.test(jsonStr)) {
      countWithBn++;
    }
  }
  console.log(`${key}: ${countWithBn} of ${val.length} have Bengali text`);
}
