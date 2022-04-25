import { diffArrays } from "../diffArrays";

describe("diff", () => {
  it("Basic", () => {
    const a = [1, 2, 3];
    const b = [2, 3, 4];

    expect(diffArrays(a, b)).toEqual({
      added: [4],
      removed: [1],
    });
  });
});
