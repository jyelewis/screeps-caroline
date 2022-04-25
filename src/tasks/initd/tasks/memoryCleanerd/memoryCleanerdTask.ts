import { Task } from "../../../../threading/Task";

export const memoryCleanerdTask: Task = function* memoryCleanerdTask(thread) {
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  yield thread.sleepSeconds(5 * 60);
  yield thread.restart();
};
