const admin = require('firebase-admin');
const config = require('config');

const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(config.get('firebaseAdminConfig')),
  databaseURL: config.get('realtimeDatabase')
});

const realtimeDatabase = firebaseApp.database();

module.exports = { realtimeDatabase };

