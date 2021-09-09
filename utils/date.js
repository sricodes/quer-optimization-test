const isMarketTime = (date) => {
  if (date.getDay() === 0 || date.getDay() === 6) return false;
  if (date.getHours() < 9 || date.getHours() > 15) return false;
  if (date.getHours() === 9 && date.getMinutes() < 15) return false;
  if (date.getHours() === 15 && date.getMinutes() > 30) return false;

  return true;
};

module.exports = { isMarketTime };
