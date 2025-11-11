const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

// Database file
const file = path.join(__dirname, '..', 'db.json');
const adapter = new FileSync(file);
const db = low(adapter);

// Initialize with defaults
db.defaults({ prices: {} }).write();

module.exports = db;