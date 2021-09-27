const mongoose = require('mongoose');

const portfolioFollowingSchema = new mongoose.Schema({
  followedPortfolio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true
  },
  followerPortfolio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true
  },
  followStartDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trader',
  },
  followEndDate: Date
});


const PortfolioFollowing = mongoose.model('PortfolioFollowing', portfolioFollowingSchema);

module.exports = {
  PortfolioFollowing
};
