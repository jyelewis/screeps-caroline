import { Task } from "../../threading/Task";

export const colonydTask: Task = function* colonydTask(thread) {
  thread.log("Starting");

  // const creep = thread.memo(() => thread.ctx.Game.creeps["Gabriel"]);
  //
  // yield thread.loop(() => {
  //   creep.move(Math.random() > 0.5 ? LEFT : RIGHT);
  //
  //   return true;
  // });

  yield thread.suspend();
};
