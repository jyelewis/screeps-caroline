import { process } from "../process";
import { top } from "../tasks/top/top";

export function exposeConsoleCommands() {
  global.c = {
    process,
    top: () => top(process),
  };
}
