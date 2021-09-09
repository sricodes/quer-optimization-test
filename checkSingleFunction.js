require('dotenv').config();
const { connect, disconnect } = require('./utils/dbConnect');
const { Portfolio } = require('./models/portfolio');
const { getPortfolioIndexValue, getAUM } = require('./modelHelpers/portfolioHelper');

(async () => {
  try {
    await connect();
    const portfolio = await Portfolio.findById('6118af60af6899ad343b087e');
    if (!portfolio) {
      console.log('potfolio not found');
    } else {
      const indexValue = await getPortfolioIndexValue(portfolio);
      const AUM = await getAUM(portfolio);
      console.log(`portfolio name = ${portfolio.name}`);
      console.log(`index value = ${indexValue}`);
      console.log(`AUM = ${AUM}`);
    }
    await disconnect();
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
})();
