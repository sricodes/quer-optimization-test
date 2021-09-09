const xirr = require('xirr');

const { Asset } = require('../../../models/asset');
const { Order } = require('../../../models/order');
const { PortfolioFollowing } = require('../../../models/portfolioFollowing');
const { Portfolio } = require('../../../models/portfolio');
const { connect, disconnect } = require('../../../utils/dbConnect');
const getSampleAsset = require('../../get-sample-asset');
const getSampleOrder = require('../../get-sample-order');
const getSamplePortfolio = require('../../get-sample-portfolio');
const { assetClasses } = require('../../../constants/assetClasses');
const { getPortfolioIndexValue, getPortfolioCurrentValue, getAUM, getMinimumFollowAmount } = require('../../../modelHelpers/portfolioHelper');
const assetHelper = require('../../../modelHelpers/assetHelper');
const { orderStatuses } = require('../../../constants/orderStatuses');

describe('portfolioHelpers unit tests', () => {
  beforeAll(async () => {
    require('dotenv').config();
    await connect();
  });
  let portfolio, cashAsset, ongcAsset, bhelAsset, ongcOrder, bhelOrder;

  beforeEach(async () => {
    cashAsset = await getSampleAsset(assetClasses.Cash, assetClasses.Cash);
    ongcAsset = await getSampleAsset('ONGC', assetClasses.Equity);
    ongcOrder = await getSampleOrder(ongcAsset._id, 1, true);
    portfolio = await getSamplePortfolio('PF1', [ongcOrder], true);
    assetHelper.getLtp = await jest.fn().mockResolvedValue(10);
  });
  afterEach(async () => {
    await Promise.all([
      Asset.deleteMany({}),
      Order.deleteMany({}),
      PortfolioFollowing.deleteMany({}),
      Portfolio.deleteMany({})
    ]);
  });
  afterAll(async () => {
    await disconnect();
  });

  describe('getPortfolioIndexValue', () => {
    it('should return index value 100 as no orderGroup present in portfolio', async () => {
      portfolio.orderGroups = [];
      const result = await getPortfolioIndexValue(portfolio);
      expect(result).toBe(100);
    });
    it('should return index value 100 as orderGroup contains no orders', async () => {
      portfolio.orderGroups = [
        {orders: [], placingDate: new Date()}
      ];
      const result = await getPortfolioIndexValue(portfolio);
      expect(result).toBe(100);
    });
    it('should return index value 100 as orderGroup.datePlaced > date', async () => {
      portfolio.orderGroups[0].placingDate = new Date(Date.now() + ( 3600 * 1000 * 24));
      const result = await getPortfolioIndexValue(portfolio);
      expect(result).toBe(100);
    });
    it('should return index value 100 as cash txn array is empty', async () => {
      const result = await getPortfolioIndexValue(portfolio);
      expect(result).toBe(100);
    });
    it('should return indexValue by simple formula as all transactions are of today only', async () => {
      portfolio.assetHoldings = [
        { asset: cashAsset._id, qty: 0 },
        { asset: ongcAsset._id, qty: ongcOrder.qtyPlaced }
      ];
      portfolio.bankToTradingAccountCashTransationsArray = [
        { cashAmount: (ongcOrder.isBuy ? -1 : 1) * ongcOrder.qtyPlaced * 9, date: ongcOrder.datePlaced }
      ];
      const result = await getPortfolioIndexValue(portfolio);
      expect(assetHelper.getLtp).toHaveBeenCalled();
      expect(result).toBe(100 * ongcOrder.qtyPlaced * (10 / 9));
    });
    it('should return indexValue by xirr as transactions are of different day than today', async () => {
      portfolio.assetHoldings = [
        { asset: cashAsset._id, qty: 0 },
        { asset: ongcAsset._id, qty: ongcOrder.qtyPlaced }
      ];
      portfolio.bankToTradingAccountCashTransationsArray = [
        { cashAmount: (ongcOrder.isBuy ? -1 : 1) * ongcOrder.qtyPlaced * 9, date: new Date(ongcOrder.datePlaced - ( 3600 * 1000 * 48)) }
      ];
      const result = await getPortfolioIndexValue(portfolio);
      expect(assetHelper.getLtp).toHaveBeenCalled();
      const xirrArr = [
        { amount: portfolio.bankToTradingAccountCashTransationsArray[0].cashAmount, when: portfolio.bankToTradingAccountCashTransationsArray[0].date },
        {amount: await getPortfolioCurrentValue(portfolio), when: new Date()}
      ];
      const xirrAnnualized = xirr(xirrArr);
      const expectedIndexValue = 100 * Math.pow(1 + xirrAnnualized, (new Date() - portfolio.bankToTradingAccountCashTransationsArray[0].date) / (365 * 24 * 60 * 60 * 1000))
      expect(Math.round((result + Number.EPSILON) * 100) / 100).toBe(Math.round((expectedIndexValue + Number.EPSILON) * 100) / 100);
    });
  });

  describe('getAUM', () => {
    let followerPortfolio;
    beforeEach(async () => {
      followerPortfolio = await getSamplePortfolio('PF1', [ongcOrder], false);
      portfolio.assetHoldings = [
        { asset: cashAsset._id, qty: 0 },
        { asset: ongcAsset._id, qty: ongcOrder.qtyPlaced }
      ];
    });
    it('should return portfolio\'s own PV as AUM as it has no follower', async () => {
      const result = await getAUM(portfolio);
      expect(result).toBe(portfolio.assetHoldings[1].qty * await assetHelper.getLtp());
    });
    it('should return portfolio\'s own + followers\' PVs as AUM as followers are present', async () => {
      const following = await new PortfolioFollowing({
        followedPortfolio: portfolio._id,
        followerPortfolio: followerPortfolio._id,
        followStartDate: followerPortfolio.createdAt
      }).save();
      portfolio.myFollowersLog.push(following._id);
      followerPortfolio.assetHoldings = [
        { asset: cashAsset._id, qty: 0 },
        { asset: ongcAsset._id, qty: ongcOrder.qtyPlaced }
      ];
      await followerPortfolio.save();
      const result = await getAUM(portfolio);
      expect(result).toBe((portfolio.assetHoldings[1].qty + followerPortfolio.assetHoldings[1].qty) * await assetHelper.getLtp());
    });
  });
  
  describe('getMinimumFollowAmount', () => {
    beforeEach(async () => {
      bhelAsset = await getSampleAsset('BHEL', assetClasses.Equity);
      bhelOrder = await getSampleOrder(bhelAsset._id, 4, true, orderStatuses.Complete);
      ongcOrder = await getSampleOrder(ongcAsset._id, 2, true, orderStatuses.Complete);
      portfolio.assetHoldings = [
        { asset: cashAsset._id, qty: 0 },
        { asset: ongcAsset._id, qty: ongcOrder.qtyPlaced },
        { asset: bhelAsset._id, qty: bhelOrder.qtyPlaced }
      ];
      portfolio.orderGroups = [{
        orders: [ongcOrder, bhelOrder],
        placingDate: ongcOrder.datePlaced
      }];
    });
    it('should return minimum follow amount', async () => {
      const result = await getMinimumFollowAmount(portfolio);
      expect(result).toBe((ongcOrder.qtyPlaced + bhelOrder.qtyPlaced) * await assetHelper.getLtp() / 2);
    });
  });
});