import { process } from "../process";
import { printTop } from "../tasks/top/printTop";

export function exposeConsoleCommands() {
  global.c = {
    process,
    top: () => printTop(process),
    thread: (threadName: string) => process.getThreadByName(threadName),
    reset: () => process.reset(),
  };
}
