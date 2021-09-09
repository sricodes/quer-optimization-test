const { getAUM, getPortfolioIndexValue, getMinimumFollowAmount } = require('./portfolioHelper');
const { Portfolio } = require('../models/portfolio');

const calculatePortfolioProgress = async function (portfolioProgress) {
  try {
    // console.time(`calculatePP-${portfolioProgress._id}`);
    const portfolio = await Portfolio.findById(portfolioProgress.portfolio);
  
    if (!portfolio) return;
    portfolioProgress.indexValue = await getPortfolioIndexValue(portfolio) || 0;
    portfolioProgress.returns = (portfolioProgress.indexValue - 100) / 100;
    portfolioProgress.followersCount = portfolio.myFollowersLog.length;
    portfolioProgress.AUM = await getAUM(portfolio) || 0;
    portfolioProgress.followerReturns = 0;
    portfolioProgress.minFollowAmount = await getMinimumFollowAmount(portfolio) || 0;
    portfolioProgress.lastCalculationDate = new Date();
  
    await portfolioProgress.save();
    // console.timeEnd(`calculatePP-${portfolioProgress._id}`);
  } catch (e) {
    console.error(e);
  }
};

module.exports = { calculatePortfolioProgress };
