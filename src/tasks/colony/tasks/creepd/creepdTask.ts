import { Task } from "../../../../threading/Task";

export const creepdTask: Task = function* creepdTask(thread) {
  thread.log("Starting");

  // * Singleton task, store some state locally
  //   * Spawn threads for new creeps when they come alive (attach to colony thread)
  // * Emit events when creeps die
  //   * Call Colony.addCreep, Colony.removeCreep as needed
  //     clean up memory

  yield thread.suspend();
};
