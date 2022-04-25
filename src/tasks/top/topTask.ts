import { Task } from "../../threading/Task";
import { printTop } from "./printTop";

export const topTask: Task = function* topTask(thread) {
  thread.memo(() => {
    console.log("\n\n\n\n\n\n\n\n\n\n\n\n");
    printTop(thread.process);
  });

  yield thread.sleepTick();
  yield thread.restart();
};
