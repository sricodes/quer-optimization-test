const { realtimeDatabase } = require('../utils/firebase');

let getLtp = async function (ticker) {
  try {
    const symbolsRef = realtimeDatabase.ref(`symbols`).child(`${ticker}::NSE`);
    const snapshot = await symbolsRef.once('value');
    const dataToSave = snapshot.val();
    if (!dataToSave) return 0;
    return dataToSave.LTP;
  } catch (e) {
    console.error(e);
  }
  
};

module.exports = { getLtp };