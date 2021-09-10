const mongoose = require('mongoose');

const orderGroupSchema = new mongoose.Schema({
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  }],
  placingDate: {
    type: Date,
    required: true,
    default: Date.now
  }
});

const assetHoldingSchema = new mongoose.Schema({ // first asset will always be cash/cumulativeProceeds
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  qty: {
    type: Number,
    required: true
  }
});


const portfolioSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 64
  },
  trader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trader'
  },
  assetHoldings: [assetHoldingSchema],
  orderGroups: [orderGroupSchema],
  myFollowersLog: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PortfolioFollowing'
  }],
  isPublic: {
    type: Boolean,
    default: false,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  portfolioProgress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PortfolioProgress',
  },
  bankToTradingAccountCashTransationsArray: [
    new mongoose.Schema({
      cashAmount: {
        type: Number
      },
      date: {
        type: Date,
        default: Date.now
      }
    })
  ],
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = {
  Portfolio
};
