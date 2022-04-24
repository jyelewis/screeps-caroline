import { Task } from "../../threading/Task";

export const colonydTask: Task = function* colonydTask(thread) {
  thread.log("Starting");

  yield thread.suspend();
};
