const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
    maxlength: 64,
    required: true
  },
  trader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trader',
    required: true
  },
  assets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  }],
  portfolios: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio'
  }]
});

const Watchlist = mongoose.model('Watchlist', watchlistSchema);


module.exports = {
  Watchlist
};
