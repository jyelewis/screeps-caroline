import { Task } from "./threading/Task";
import { initdTask } from "./tasks/initd/initdTask";
import { colonydTask } from "./tasks/colonyd/colonydTask";
import { creepdTask } from "./tasks/creepd/creepdTask";
import { memoryCleanerTask } from "./tasks/creepd/tasks/memoryCleanerTask";
import { topTask } from "./tasks/top/topTask";

export const allTasks = (): Task<any>[] => [
  initdTask,
  creepdTask,
  colonydTask,
  memoryCleanerTask,
  topTask,
];
