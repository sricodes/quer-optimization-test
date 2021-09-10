const mongoose = require('mongoose');

const { getAUM, getPortfolioIndexValue, getMinimumFollowAmount} = require('../modelHelpers/portfolioHelper');

const { PortfolioFollowing } = require('../models/portfolioFollowing');

const formatPortfolioResponse = async (portfolio, trader) => {

  if (mongoose.Types.ObjectId.isValid(portfolio.portfolioProgress)) await portfolio.populate('portfolioProgress');
  if (mongoose.Types.ObjectId.isValid(portfolio.trader)) await portfolio.populate('trader');
  if (mongoose.Types.ObjectId.isValid(portfolio.iFollowedLog)) {
    await portfolio.populate({
      path: 'iFollowedLog',
      populate: {
        path: 'followedPortfolio'
      }
    });
  }

  const indexValue = portfolio.portfolioProgress ? portfolio.portfolioProgress.indexValue : await getPortfolioIndexValue(portfolio);
  const returns = (indexValue - 100) / 100;
  const followersCount = portfolio.portfolioProgress ? portfolio.portfolioProgress.followersCount : portfolio.myFollowersLog.length;

  const AUM = portfolio.portfolioProgress ? portfolio.portfolioProgress.AUM : await getAUM(portfolio);
  const followerReturns = 0;
  const createdAt = portfolio.orderGroups[0]?.placingDate ? portfolio.orderGroups[0].placingDate : portfolio.createdAt;

  const minFollowAmount = Math.ceil((portfolio.portfolioProgress ? portfolio.portfolioProgress.minFollowAmount : await portfolio.getMinimumFollowAmount()));

  const isFollowedRecord = await PortfolioFollowing.findOne({
    follower: trader._id,
    followedPortfolio: portfolio._id,
    followEndDate: undefined
  })
    .populate('followerPortfolio');

  return {
    name: portfolio.trader.name,
    indexValue,
    returns,
    followersCount,
    AUM,
    followerReturns,
    minFollowAmount,
    portfolio: {
      id: portfolio.id,
      name: portfolio.name,
      trader: {
        id: portfolio.trader.id,
        name: portfolio.trader.name,
        profilePicUrl: portfolio.trader.profilePicUrl
      },
      assetClasses: portfolio.assetClasses,
      isFeaturedPortfolio: portfolio.isFeaturedPortfolio,
      tags: portfolio.tags,
      areAssetClassesLocked: portfolio.areAssetClassesLocked,
      isPublic: portfolio.isPublic,
      followedPortfolio: portfolio.iFollowedLog
    },
    isFollowed: !!isFollowedRecord,
    followedPortfolio: portfolio.iFollowedLog?.followedPortfolio ? {
      id: portfolio.iFollowedLog?.followedPortfolio.id,
      name: portfolio.iFollowedLog?.followedPortfolio.name
    } : undefined,
    followerPortfolio: isFollowedRecord ? {
      id: isFollowedRecord.followerPortfolio?.id,
      name: isFollowedRecord.followerPortfolio?.name
    } : undefined,
    createdAt
  };
};

module.exports = {
  formatPortfolioResponse
};