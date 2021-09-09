/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { calculatePortfolioProgress } = require('../../modelHelpers/portfolioProgressHelper');
const { PortfolioProgress } = require('../../models/portfolioProgress');
const { connect, disconnect } = require('../../utils/dbConnect');
const { isMarketTime } = require('../../utils/date');

module.exports = async (job) => {
  if (!isMarketTime) return;
  try {
    await connect();
    console.time('ppConsumer');
    const progresses = await PortfolioProgress.find();

    await Promise.all(progresses.map(async (progress) => {
      await calculatePortfolioProgress(progress);
    }));
    console.timeEnd('ppConsumer');
  } catch (error) {
    console.error('error', error);
    job.retry();
  } finally {
    await disconnect();
  }
};
