import { costForParts } from "../costForParts";

describe("codeForParts", () => {
  it("Adds up cost", () => {
    expect(costForParts([])).toEqual(0);
    expect(costForParts([MOVE, CARRY])).toEqual(100);
    expect(costForParts([MOVE, CARRY, WORK])).toEqual(200);
    expect(costForParts([MOVE, CLAIM])).toEqual(650);
  });
});
