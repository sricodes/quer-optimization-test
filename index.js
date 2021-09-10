const express = require('express');
const { createBullBoard } = require('bull-board');
const { BullAdapter } = require('bull-board/bullAdapter');
require('dotenv').config();

const { bestReturnsProducer } = require('./tasks/best-returns/producer');
const { portfolioProgressesProducer } = require('./tasks/portfolio-progress/producer');
const auth = require('./middleware/auth');
const { formatPortfolioResponse } = require('./utils/portfolioResponse');
const {
  bestReturnsSchedule, 
  portfolioProgressSchedule
} = require('./queues/index');
const { Trader } = require('./models/trader');
const { connect } = require('./utils/dbConnect');
const { SortedPortfolioArray } = require('./models/sortedPortfolioArray');
connect();

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('The sedulous hyena ate the antelope!');
});
app.get('/authToken', async (req, res) => {
  const trader = await Trader.findOne({name: 'Gaurav Agrawal'});
  return res.status(200).send(trader.generateAuthToken());
});
app.get('/welcome', [auth], async (req, res) => {

  const getPortfolios = (groupName) => SortedPortfolioArray.findOne({ name: groupName })
  .populate({
    path: 'sortedPortfolios',
    populate: [
      { path: 'portfolioProgress' },
      { path: 'trader', select: '_id name profilePicUrl' }
    ]
  });
  const countPortfolios = async (groupName) => (await SortedPortfolioArray.findOne({ name: groupName }))?.sortedPortfolios.length || 0;

  const bestEquity = await getPortfolios('bestEquity');
  const bestEquityCount = await countPortfolios('bestEquity');
  const trader = {req};
  const response = {
    bestEquity: await Promise.all(bestEquity.sortedPortfolios.map((pfId) => formatPortfolioResponse(pfId, trader))),
    bestEquityCount
  };
  // console.timeEnd('bestportfolios');
  return res.send(response);
});

bestReturnsProducer();
portfolioProgressesProducer();

const { router } = createBullBoard([
  // new BullAdapter(misOrdersSchedule),
  new BullAdapter(bestReturnsSchedule),
  // new BullAdapter(portfolioMetricsSchedule),
  // new BullAdapter(portfolioOfTheWeekSchedule),
  new BullAdapter(portfolioProgressSchedule)
]);

app.use('/admin/queues', router);

app.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});

module.exports = { app };
