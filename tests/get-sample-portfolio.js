const { Portfolio } = require('../models/portfolio');

module.exports = async function (name, orders, isPublic, saveInDB = true) {
  const pf = new Portfolio({
    name,
    isPublic
  });
  if (orders) {
    pf.orderGroups.push({
      orders,
      placingDate: orders[0].datePlaced
    });
  }
  if (saveInDB) await pf.save();
  return pf;
};
