const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

// Database file
const file = path.join(__dirname, '..', 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, { prices: {} });

// Initialize
async function initDB() {
  await db.read();
  if (!db.data.prices) {
    db.data.prices = {};
  }
  await db.write();
}

initDB();

module.exports = db;