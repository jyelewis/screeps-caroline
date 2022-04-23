import { randomBetween } from "../randomBetween";

describe("randomBetween", () => {
  it("Returns random integers between bounds", () => {
    for (let i = 0; i < 100; i++) {
      expect(randomBetween(0, 1)).toBeGreaterThanOrEqual(0);
      expect(randomBetween(0, 1)).toBeLessThanOrEqual(1);

      expect(randomBetween(0, 100)).toBeGreaterThanOrEqual(0);
      expect(randomBetween(0, 100)).toBeLessThanOrEqual(100);

      expect(randomBetween(50, 150)).toBeGreaterThanOrEqual(50);
      expect(randomBetween(50, 150)).toBeLessThanOrEqual(150);

      // check we always get an int
      expect(randomBetween(0, 1) % 1).toEqual(0);
    }
  });
});
