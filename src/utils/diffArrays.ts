export function diffArrays<T>(
  prev: T[],
  next: T[]
): {
  added: T[];
  removed: T[];
} {
  let added = next.filter((x) => prev.indexOf(x) === -1);
  let removed = prev.filter((x) => next.indexOf(x) === -1);

  return {
    added,
    removed,
  };
}
