const Queue = require('bull');
const config = require('config');
const bestReturnsConsumer = require('../tasks/best-returns/consumer');
// const portfolioMetricsConsumer = require('../tasks/portfolio-metrics/consumer');
// const portfolioOfTheWeekConsumer = require('../tasks/portfolio-of-week/consumer');
// const misOrdersConsumer = require('../tasks/mis-orders/consumer');
const portfolioProgressesConsumer = require('../tasks/portfolio-progress/consumer');
// const postbackOrdersConsumer = require('../tasks/postback-orders/consumer');
// const brokerTokenExpirationConsumer = require('../tasks/broker-token-expiration/consumer');

const getQueue = (name) => new Queue(name, {
  redis: {
    port: config.get('redisPort') || 6379
  }
});

const defaultCompletion = (job) => job.remove();

const defaultFailure = (job) => {
  console.error(`Job ${job.id} failed!`);
  console.error(job);
  return job.remove();
};

const bestReturnsSchedule = getQueue('BestReturns');
// const portfolioMetricsSchedule = getQueue('PortfolioMetricsQueue');
// const portfolioOfTheWeekSchedule = getQueue('portfolioOfTheWeekQueue');
// const misOrdersSchedule = getQueue('MisOrders');
const portfolioProgressSchedule = getQueue('PortfolioProgresses');

bestReturnsSchedule
  .on('completed', defaultCompletion)
  .on('failed', defaultFailure)
  .process(bestReturnsConsumer);

// portfolioMetricsSchedule
//   .on('completed', defaultCompletion)
//   .on('failed', defaultFailure)
//   .process(portfolioMetricsConsumer);

// portfolioOfTheWeekSchedule
//   .on('completed', defaultCompletion)
//   .on('failed', defaultFailure)
//   .process(portfolioOfTheWeekConsumer);

// misOrdersSchedule
//   .on('completed', defaultCompletion)
//   .on('failed', defaultFailure)
//   .process(misOrdersConsumer);

portfolioProgressSchedule
  .on('completed', defaultCompletion)
  .on('failed', defaultFailure)
  .process(portfolioProgressesConsumer);


module.exports = {
  bestReturnsSchedule,
  // portfolioMetricsSchedule,
  // portfolioOfTheWeekSchedule,
  // misOrdersSchedule,
  portfolioProgressSchedule,
  // postbackQueue,
  // brokerTokenExpirationQueue,
  // pendingFollowingQueue
};
