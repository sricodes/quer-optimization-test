const { getLtp } = require("../../../modelHelpers/assetHelper");

describe('assetHelper unit tests', () => {
  describe('getLtp', () => {
    let ticker;
    it('should return ltp > 0 as valid ticker passed', async () => {
      const result = await getLtp('ONGC');
      expect(result).toBeGreaterThan(0);
    });
    it('should return 0 as invalid ticker passed', async () => {
      const result = await getLtp('GARBAGE');
      expect(result).toBe(0);
    });
  });
});