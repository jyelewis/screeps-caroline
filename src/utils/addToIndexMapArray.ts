export function addToIndexMapArray<K, V>(
  indexMapArray: Map<K, V[]>,
  key: K,
  item: V
) {
  const existingArray = indexMapArray.get(key);
  if (existingArray !== undefined) {
    // add to existing array
    existingArray.push(item);
  } else {
    // init array
    indexMapArray.set(key, [item]);
  }
}
