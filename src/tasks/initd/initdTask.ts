import { Task } from "../../threading/Task";
import { colonydTask } from "./tasks/colonyd/colonydTask";
import { topTask } from "../top/topTask";
import { contextdTask } from "./tasks/contextd/contextdTask";
import { memoryCleanerdTask } from "./tasks/memoryCleanerd/memoryCleanerdTask";

export const initdTask: Task = function* initdTask(thread) {
  // start child daemons
  thread.startSubThread(contextdTask, {});
  thread.startSubThread(memoryCleanerdTask, {});
  thread.startSubThread(colonydTask, {});

  // start top level daemons
  thread.startSubThread(
    topTask,
    {},
    {
      startSuspended: true,
      parentThreadId: null,
    }
  );

  yield thread.suspend();
};
