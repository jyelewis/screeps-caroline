import { Task } from "../../../threading/Task";

export const memoryCleanerTask: Task = function* memoryCleanerTask(thread) {
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  yield thread.sleepSeconds(60);
  yield thread.restart();
};
