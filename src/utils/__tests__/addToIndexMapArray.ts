import { addToIndexMapArray } from "../addToIndexMapArray";

describe("addToIndexMapArray", () => {
  const map = new Map<string, number[]>();
  it("Adds first", () => {
    addToIndexMapArray(map, "a", 1);
    expect(Array.from(map.entries())).toEqual([["a", [1]]]);
  });

  it("Adds second", () => {
    addToIndexMapArray(map, "a", 2);
    expect(Array.from(map.entries())).toEqual([["a", [1, 2]]]);
  });

  it("Adds third", () => {
    addToIndexMapArray(map, "a", 3);
    expect(Array.from(map.entries())).toEqual([["a", [1, 2, 3]]]);
  });

  it("Adds first alternate key", () => {
    addToIndexMapArray(map, "b", 1);
    expect(Array.from(map.entries())).toEqual([
      ["a", [1, 2, 3]],
      ["b", [1]],
    ]);
  });

  it("Adds second alternate key", () => {
    addToIndexMapArray(map, "b", 2);
    expect(Array.from(map.entries())).toEqual([
      ["a", [1, 2, 3]],
      ["b", [1, 2]],
    ]);
  });
});
