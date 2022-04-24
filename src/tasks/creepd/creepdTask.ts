import { Task } from "../../threading/Task";
import { memoryCleanerTask } from "./tasks/memoryCleanerTask";

export const creepdTask: Task = function* creepdTask(thread) {
  thread.log("Starting");

  thread.startSubThread(memoryCleanerTask, {});

  yield thread.suspend();
};
