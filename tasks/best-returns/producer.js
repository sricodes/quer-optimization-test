const { bestReturnsSchedule } = require('../../queues/index');

const bestReturnsProducer = async () => {
  try {
    await bestReturnsSchedule.add({}, {
      repeat: { cron: '35 15 * * *' } // Every day at 1535 hrs India time
    });
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  bestReturnsProducer
};
