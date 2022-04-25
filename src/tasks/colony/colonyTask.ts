import { Task } from "../../threading/Task";
import { creepdTask } from "./tasks/creepd/creepdTask";

export const colonyTask: Task<{ colonyName: string }> = function* colonyTask(
  thread
) {
  const colonyName = thread.props.colonyName;

  const colony456 = thread.ctx.Colonies[colonyName];
  thread.log(`Colony thread started`, typeof colony456, colony456);
  thread.log("roomName", colony456.roomName);

  thread.startSubThread(creepdTask, { colonyName });

  yield thread.suspend();
};
colonyTask.customName = (props) => `colony[${props.colonyName}]`;
