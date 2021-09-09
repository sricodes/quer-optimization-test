const mongoose = require('mongoose');
const { assetClasses } = require('../constants/assetClasses');

const assetSchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 64
  },
  type: {
    type: String,
    enum: [
      assetClasses.Equity,
      assetClasses.Currencies,
      assetClasses.Commodities,
      assetClasses.FnO,
      assetClasses.Cash,
      assetClasses.Portfolio,
      assetClasses.Option,
      assetClasses.Futures
    ],
    required: true
  },
  lotSize: {
    type: Number,
    required: true,
    default: 1
  }
  });

const Asset = mongoose.model('Asset', assetSchema);

module.exports = {
  Asset
};
