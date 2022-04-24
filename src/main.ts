import { ErrorMapper } from "utils/ErrorMapper";
import { exposeConsoleCommands } from "./console/exposeConsoleCommands";
import { createProcess, process } from "./process";

function setup() {
  // will auto hydrate from Memory.process
  console.log("--- Cold start ---");
  createProcess();
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);

  process.execute(Game.time);

  exposeConsoleCommands();
});

setup();
