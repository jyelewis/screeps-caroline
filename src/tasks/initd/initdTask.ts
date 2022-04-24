import { Task } from "../../threading/Task";
import { creepdTask } from "../creepd/creepdTask";
import { colonydTask } from "../colonyd/colonydTask";
import { topTask } from "../top/topTask";

export const initdTask: Task = function* initdTask(thread) {
  thread.log("Starting");

  thread.startSubThread(
    creepdTask,
    {},
    {
      parentThreadId: null,
    }
  );

  thread.startSubThread(
    colonydTask,
    {},
    {
      parentThreadId: null,
    }
  );

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
