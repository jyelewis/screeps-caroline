import { Process } from "../../threading/Process";
import { Thread } from "../../threading/Thread";
import { printTable } from "../../utils/printTable";

export function top(process: Process) {
  const allThreads = process.threads.slice();
  allThreads.sort((a, b) => a.name.localeCompare(b.name));

  const topOutput: string[][] = [];
  topOutput.push(["Id", "Name", "State", "Children", "Restarts", "Crashes"]);
  for (const thread of allThreads) {
    topOutput.push([
      thread.id.toString(),
      thread.name,
      stateForThread(thread),
      thread.state.childThreadIds.length.toString(),
      thread.state.numRestarts.toString(),
      thread.state.numCrashes.toString(),
    ]);
  }

  printTable(topOutput);
}

function stateForThread(thread: Thread) {
  if (thread.state.nextExecution === null) {
    return "Suspended";
  }

  if (thread.state.lastExecution < thread.process.currentTime - 5) {
    return "Sleeping";
  }

  return "Running";
}
