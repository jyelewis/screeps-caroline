import { randomHumanName } from "../humanNames";

describe("humanNames", () => {
  it("Returns names", () => {
    expect(typeof randomHumanName()).toEqual("string");
    expect(randomHumanName().length).toBeGreaterThanOrEqual(3);
  });
});
