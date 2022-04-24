import { Task } from "../../threading/Task";
import { top } from "./top";

export const topTask: Task = function* topTask(thread) {
  thread.memo(() => {
    console.log("\n\n\n\n\n\n\n\n\n\n\n\n");
    top(thread.process);
  });

  yield thread.sleepTick();
  yield thread.restart();
};
