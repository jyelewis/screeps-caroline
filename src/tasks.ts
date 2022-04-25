import { Task } from "./threading/Task";
import { initdTask } from "./tasks/initd/initdTask";
import { colonydTask } from "./tasks/initd/tasks/colonyd/colonydTask";
import { creepdTask } from "./tasks/colony/tasks/creepd/creepdTask";
import { topTask } from "./tasks/top/topTask";
import { contextdTask } from "./tasks/initd/tasks/contextd/contextdTask";
import { colonyTask } from "./tasks/colony/colonyTask";
import { memoryCleanerdTask } from "./tasks/initd/tasks/memoryCleanerd/memoryCleanerdTask";

export const allTasks = (): Task<any>[] => [
  initdTask,
  contextdTask,
  creepdTask,
  colonydTask,
  memoryCleanerdTask,
  topTask,
  colonyTask,
];
