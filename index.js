const express = require('express');
const { createBullBoard } = require('bull-board');
const { BullAdapter } = require('bull-board/bullAdapter');
require('dotenv').config();

const { bestReturnsProducer } = require('./tasks/best-returns/producer');
const { portfolioProgressesProducer } = require('./tasks/portfolio-progress/producer');

const {
  // misOrdersSchedule, 
  bestReturnsSchedule, 
  // portfolioMetricsSchedule, portfolioOfTheWeekSchedule, 
  portfolioProgressSchedule
} = require('./queues/index');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('The sedulous hyena ate the antelope!');
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
