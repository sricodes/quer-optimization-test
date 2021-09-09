const { Asset } = require('../models/asset');

module.exports = async (ticker, type, saveInDB = true) => {
  const asset = new Asset({
    ticker,
    type
  });

  if (saveInDB) await asset.save();

  return asset;
};
