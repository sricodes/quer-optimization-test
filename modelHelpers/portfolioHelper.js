const xirr = require('xirr');
const mongoose = require('mongoose');

const { PortfolioFollowing } = require('../models/portfolioFollowing');
const { Asset } = require('../models/asset');
const { Order } = require('../models/order');
const assetHelper = require('./assetHelper');
const { assetClasses } = require('../constants/assetClasses');
const { orderStatuses } = require('../constants/orderStatuses');
const { Portfolio } = require('../models/portfolio');

// will only return open orders for today
const getOpenOrders = (portfolio) => {
  const orders = portfolio.orderGroups.map((orderGroup) => orderGroup.orders.filter((order) => {
    const today = new Date();
    // eslint-disable-next-line max-len
    return (order.status === orderStatuses.Pending && order.datePlaced?.getDate() === today.getDate() && order.datePlaced?.getMonth() === today.getMonth() && order.datePlaced?.getFullYear() === today.getFullYear());
  })).flat();
  return orders;
};

const getLotsPerAssetAndOpenOrder = async (portfolio) => {
  try {
    const openOrders = getOpenOrders(portfolio);
    const holdingLots = portfolio.assetHoldings.filter((ah) => ah.qty > 0).map((holding) => holding.qty);
    const orderLots = await Promise.all(openOrders.map(async (order) => {
      if (mongoose.Types.ObjectId.isValid(order.asset)) order.asset = await Asset.findById(order.asset);
      return order.qtyPlaced / order.asset.lotSize;
    }));
    return [...holdingLots, ...orderLots];
  } catch (e) {
    console.error(e);
  }
};

const getMinimumLotsArray = async (portfolio) => {
  try {
    const lotsArray = await getLotsPerAssetAndOpenOrder(portfolio);
    const minLot = Math.min.apply(null, lotsArray.map(Math.abs));
    const openOrders = getOpenOrders(portfolio);
  
    const assetHoldingArray = await portfolio.assetHoldings.filter((ah) => ah.qty > 0).reduce(async (promiseAccumulator, holding) => {
      const accumulator = await promiseAccumulator;
      if (mongoose.Types.ObjectId.isValid(holding.asset)) holding.asset = await Asset.findById(holding.asset);
      if (holding.asset) {
        accumulator.push({
          asset: holding.asset,
          qty: Math.round(holding.qty / minLot)
        });
      }
      return accumulator;
    }, Promise.resolve([]));
    const ordersArray = await openOrders.reduce(async (promiseAccumulator, order) => {
      const accumulator = await promiseAccumulator;
      if (mongoose.Types.ObjectId.isValid(order)) order = await Order.findById(order);
      if (order) {
        accumulator.push({
          order,
          qty: Math.round(order.qtyPlaced / minLot)
        });
      }
      return accumulator;
    }, Promise.resolve([]));
  
    return [...assetHoldingArray, ...ordersArray];
  } catch (e) {
    console.error(e);
  }
};

const getPortfolioCurrentValue = async (portfolio) => {
  try {
    if (!portfolio) return 0;
    const { assetHoldings } = portfolio;
  
    if (!assetHoldings || assetHoldings?.length === 0) return 0;
    if (assetHoldings.length === 1) return assetHoldings[0].qty;

    const pv = (await Promise.all(assetHoldings.map(async (holding) => {
      if (mongoose.Types.ObjectId.isValid(holding.asset)) holding.asset = await Asset.findById(holding.asset);
      if (!holding.asset) {
        return 0;
      }
      if (holding.asset.type === assetClasses.Cash) return holding.qty;
      if (holding.asset.type === assetClasses.Equity) {
        const ltp = await assetHelper.getLtp(holding.asset.ticker);
        return holding.qty * (ltp || 0);
      }
      return 0;
    }))).reduce((accumulator, value) => accumulator + value, 0);
  
    return pv;
  } catch (e) {
    console.error(e);
  }
};


const getMarginRequiredFromOrders = async (orders) => {
  try {
    const orderMargins = await Promise.all(orders.map(async (order) => {
      const {
        asset, qtyPlaced
      } = order;
      if (asset.type === assetClasses.Equity) return await assetHelper.getLtp(asset.ticker) * qtyPlaced;
      return 0;
    }));
    return orderMargins.reduce((a, b) => a + b || 0, 0);
  } catch (e) {
    console.error(e);
  }
};

const getOrdersWithMinPossibleQty = async (portfolio) => {
  try {
    const minLotsArr = await getMinimumLotsArray(portfolio);
    const orders = minLotsArr.map((lotItem) => {
      if (lotItem.asset) {
        return new Order({
          asset: lotItem.asset,
          qtyPlaced: Math.abs(lotItem.qty),
          isBuy: lotItem.qty > 0,
        });
      }
      return lotItem.order;
    });
    return orders;
  } catch (e) {
    console.error(e);
  }
};


const getPortfolioIndexValue = async function (portfolio) {
  try {
    // console.time(`getPortfolioIndexValue-${portfolio._id}`);
    const date = new Date();
    if (!portfolio.orderGroups || portfolio.orderGroups.length === 0) return 100;
    if (!portfolio.orderGroups[0].orders || portfolio.orderGroups[0].orders.length === 0) return 100;
    if (date <= portfolio.orderGroups[0].placingDate) return 100;
  
    if (!portfolio.bankToTradingAccountCashTransationsArray || portfolio.bankToTradingAccountCashTransationsArray.length === 0) return 100;
  
    const eligibleCashTransactions = portfolio.bankToTradingAccountCashTransationsArray.filter((transaction) => transaction.date <= date);
  
    if (!eligibleCashTransactions || eligibleCashTransactions.length === 0) return 100;
  
    const pv = await getPortfolioCurrentValue(portfolio);
    const sameDate = (eligibleCashTransactions[0].date.getDate() === date.getDate()) && (eligibleCashTransactions[0].date.getMonth() === date.getMonth()) && (eligibleCashTransactions[0].date.getFullYear() === date.getFullYear());
    if (sameDate) {
      let sumInvested = 0;
      let sumRealized = 0;
      eligibleCashTransactions.forEach((txn) => txn.cashAmount > 0 ? sumRealized += txn.cashAmount : sumInvested += txn.cashAmount);
      return (sumInvested !== 0 ? 100 * ((sumRealized + pv) / -sumInvested) : 100);
    }
    const xirrArr = [...eligibleCashTransactions.map(({ cashAmount, date: transactionDate }) => ({
      amount: cashAmount,
      when: transactionDate
    })), {
      amount: pv,
      when: date
    }];
    let xirrAnnualized = 0;
    try {
      xirrAnnualized = xirr(xirrArr);
    } catch (e) {
      xirrAnnualized = 0;
    }
    if (xirrAnnualized === 0) return 100;
  
    // 365 * 24 * 60 * 60 * 1000 - ms in year
    // eslint-disable-next-line no-restricted-properties
    // console.timeEnd(`getPortfolioIndexValue-${portfolio._id}`);
    return 100 * Math.pow(1 + xirrAnnualized, (date - portfolio.bankToTradingAccountCashTransationsArray[0].date) / (365 * 24 * 60 * 60 * 1000));
  } catch (e) {
    console.error(e);
  }
};


const getMinimumFollowAmount = async function (portfolio) {
  try {
    // console.time(`getMinimumFollowAmount-${portfolio._id}`);
    const minQtyOrdersArr = await getOrdersWithMinPossibleQty(portfolio);
    const minFollowAmount = await getMarginRequiredFromOrders(minQtyOrdersArr) || 0;
    // console.timeEnd(`getMinimumFollowAmount-${portfolio._id}`);
    return minFollowAmount;
  } catch (e) {
    console.error(e);
  }
};



const getAUM = async function (portfolio) {
  try {
    console.time(`getAUM-${portfolio._id}`);
    const date = new Date();
    // console.time(`getPVCurrentValueInAUM-${portfolio._id}`);
    const AUM = await getPortfolioCurrentValue(portfolio);
    // console.timeEnd(`getPVCurrentValueInAUM-${portfolio._id}`);
    if (!portfolio.myFollowersLog || portfolio.myFollowersLog?.length === 0) return AUM;
    // console.time(`populateInAUM-${portfolio._id}`);
    // const followerLogs = await PortfolioFollowing.find({
    //   $and: [
    //     { followedPortfolio: this._id },
    //     { followStartDate: { $lte: date } },
    //     {
    //       $or: [
    //         { followEndDate: { $gte: date } },
    //         { followEndDate: undefined }
    //       ]
    //     }
    //   ]
    // }, 'followerPortfolio').lean(); // .populate('followerPortfolio').select('_id assetHoldings').lean() 
    
    // await portfolio.populate({
    //   path: 'myFollowersLog',
    //   populate: {
    //     path: 'followerPortfolio'
    //   }
    // });
    // console.timeEnd(`populateInAUM-${portfolio._id}`);
    
    console.time(`followersAUM-${portfolio._id}`);
    const followersAum = (await Promise.all(portfolio.myFollowersLog.map(async (followerLog) => {
      const following = await PortfolioFollowing.findById(followerLog, 'followerPortfolio').lean();
      const pf = await Portfolio.findById(following.followerPortfolio, 'assetHoldings').lean();
      if (!pf) return 0;
      const value = await getPortfolioCurrentValue(pf) ;
      return value;
    }))).reduce((a, b) => a + (b || 0), 0);
    console.timeEnd(`followersAUM-${portfolio._id}`);
    console.timeEnd(`getAUM-${portfolio._id}`);
    return AUM + followersAum;
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  getPortfolioIndexValue,
  getPortfolioCurrentValue,
  getAUM,
  getMinimumFollowAmount
};