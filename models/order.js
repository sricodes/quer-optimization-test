const mongoose = require('mongoose');

const { orderStatuses } = require('../constants/orderStatuses');

const orderSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  qtyPlaced: {
    type: Number,
    min: 1,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: [
      orderStatuses.Pending,
      orderStatuses.Executed,
      orderStatuses.Failed,
      orderStatuses.Partial,
      orderStatuses.Cancelled,
      orderStatuses.Ongoing,
      orderStatuses.Complete
    ],
    default: orderStatuses.Pending
  },
    isBuy: {
    type: Boolean,
    required: true
  },
  datePlaced: {
    type: Date,
    required: true,
    default: Date.now
  }
});


const Order = mongoose.model('Order', orderSchema);

module.exports = {
  Order
};
