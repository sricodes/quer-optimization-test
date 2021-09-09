const mongoose = require('mongoose');

// const mongoURL = `${process.env.MONGO_URL}/${process.env.DBNAME}`;

const connect = async () => {
  try {
    const mongoUrlKey = `MONGO_URL${process.env.NODE_ENV ? '_' + process.env.NODE_ENV.toUpperCase() : ''}`;
    const dbNameKey = `DBNAME${process.env.NODE_ENV ? '_' + process.env.NODE_ENV.toUpperCase() : ''}`;
    const mongoURL = `${process.env[mongoUrlKey]}/${process.env[dbNameKey]}`;
    await mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true }, () => {
      console.log(`connected to ${mongoURL}`);
    });
  } catch (e) {
    console.error(e);
  }
};

const disconnect = async () => {
  await mongoose.disconnect();
  console.log('disconnected from db');
};

module.exports = {
  connect,
  disconnect
};
