const mongoose = require('mongoose');

const portfolioProgressSchema = new mongoose.Schema({
  portfolio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true,
    unique: true
  },
  indexValue: {
    type: Number,
    default: 0
  },
  returns: {
    type: Number,
    default: 0
  },
  followersCount: {
    type: Number,
    default: 0
  },
  AUM: {
    type: Number,
    default: 0
  },
  followerReturns: {
    type: Number,
    default: 0
  },
  minFollowAmount: {
    type: Number,
    default: 0
  },
  lastCalculationDate: {
    type: Date,
    default: Date.now
  }
});

const PortfolioProgress = mongoose.model('PortfolioProgress', portfolioProgressSchema);

module.exports = {
  PortfolioProgress
};
