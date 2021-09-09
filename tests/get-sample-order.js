/* eslint-disable consistent-return */
const { Order } = require('../models/order');
const { Asset } = require('../models/asset');

module.exports = async function (assetId, qtyPlaced, isBuy, status, saveInDB = true) {
  if (!isBuy) isBuy = true;
  const asset = await Asset.findById(assetId, '').lean();
  if (!asset) return;
  const order = new Order({
    asset: assetId,
    qtyPlaced,
    isBuy
  });
  if (status) order.status = status;
  if (saveInDB) await order.save();
  return order;
};
