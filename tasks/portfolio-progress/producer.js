const { portfolioProgressSchedule } = require('../../queues/index');

const portfolioProgressesProducer = async () => {
  try {
    await portfolioProgressSchedule.add({}, {
      repeat: { cron: '*/30 * * * *' } // At every 30th minute
    });
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  portfolioProgressesProducer
};
