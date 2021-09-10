const jwt = require('jsonwebtoken');
const config = require('config');

const { Trader } = require('../models/trader');


const auth = async (req, res, next) => {
  const token = req.header('user-access-token');
  if (!token) return res.status(403).send('Access denied. No token provided.');

  try {
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    req.decodedToken = decoded;
    const trader = await Trader.findById(decoded._id)
      .populate({
        path: 'myPortfolios',
        populate: {
          path: 'myFollowersLog orderGroups.orders trader portfolioProgress'
        }
      });
    if (!trader) {
      return res.status(404).send('Trader not found.');
    }

    req.trader = trader;
    return next();
  } catch (error) {
    return res.status(403).send(error.message);
  }
};

module.exports = auth;
