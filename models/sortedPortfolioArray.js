const mongoose = require('mongoose');

const sortedPortfolioArraySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  sortedPortfolios: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio'
  }],
  lastAmendedAt: {
    type: Date,
    default: Date.now
  }
});

const SortedPortfolioArray = mongoose.model('SortedPortfolioArray', sortedPortfolioArraySchema);

module.exports = {
  SortedPortfolioArray
};
