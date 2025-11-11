const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

// Database file - use /tmp for Vercel serverless (writable), or local for development
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const dbDir = isVercel ? '/tmp' : path.join(__dirname, '..');
const file = path.join(dbDir, 'db.json');

console.log('Database location:', file);

const adapter = new FileSync(file);
const db = low(adapter);

// Initialize with defaults
db.defaults({ prices: {} }).write();

module.exports = db;