/* eslint-disable no-unused-vars */
/* eslint-disable no-control-regex */
const mongoose = require('mongoose');
const config = require('config');
const jwt = require('jsonwebtoken');

const traderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 64
  },
  myPortfolios: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio'
  }],
  watchlists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Watchlist'
  }]
});

traderSchema.methods.generateAuthToken = function () {
  return jwt.sign({
    _id: this._id,
  }, config.get('jwtPrivateKey'), { expiresIn: config.get('userTokenExpiresIn') });
};


const Trader = mongoose.model('Trader', traderSchema);

module.exports = {
  Trader
};
