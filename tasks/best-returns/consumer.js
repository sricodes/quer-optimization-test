const config = require('config');

const { Portfolio } = require('../../models/portfolio');
const { SortedPortfolioArray } = require('../../models/sortedPortfolioArray');
const { connect, disconnect } = require('../../utils/dbConnect');

module.exports = async (job) => {
  
  try {
    console.time('bestReturnConsumer');
    await connect();
    const getPipeline = () => [
      {
        $match: {
          isPublic: true
        }
      }, {
        $lookup: {
          from: 'portfolioprogresses',
          localField: 'portfolioProgress',
          foreignField: '_id',
          as: 'portfolioProgress'
        }
      }, {
        $unwind: {
          path: '$portfolioProgress',
          preserveNullAndEmptyArrays: true
        }
      }, {
        $sort: {
          'portfolioProgress.returns': -1
        }
      }, {
        $match: {
          'portfolioProgress.AUM': { $gt: 0 },
          'portfolioProgress.returns': { $gt: 0 }
        }
      }, { $limit: config.get('bestPortfoliosCount') }, {
        $project: {
          _id: 1
        }
      }
    ];

    const bestEquityIds = await Portfolio.aggregate(getPipeline());

    const saveData = (name, array) => SortedPortfolioArray.findOneAndUpdate({
      name
    }, {
      sortedPortfolios: array.map((i) => i._id),
      lastAmendedAt: new Date()
    }, { upsert: true, new: true });

    await saveData('bestEquity', bestEquityIds);
    await disconnect();
    console.timeEnd('bestReturnConsumer');
  } catch (error) {
    console.error('error', error);
    job.retry();
  }
};
