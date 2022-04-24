export function printTable(rows: string[][]) {
  let columnSizes = new Array(rows[0].length).fill(0);

  // find the largest values from each column
  for (const row of rows) {
    for (const [columnNumber, colVal] of row.entries()) {
      columnSizes[columnNumber] = Math.max(
        columnSizes[columnNumber],
        colVal.length
      );
    }
  }

  let str = "";
  for (const row of rows) {
    for (const [columnNumber, colVal] of row.entries()) {
      const paddingNeeded = columnSizes[columnNumber] - colVal.length;
      str += "| " + colVal + " ".repeat(paddingNeeded + 1);
    }
    str += "|\n";
  }

  console.log(str);
}
