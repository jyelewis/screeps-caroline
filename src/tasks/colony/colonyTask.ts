import { Task } from "../../threading/Task";
import { creepdTask } from "./tasks/creepd/creepdTask";

export const colonyTask: Task<{ colonyName: string }> = function* colonyTask(
  thread
) {
  const colonyName = thread.props.colonyName;

  thread.startSubThread(creepdTask, { colonyName });

  yield thread.suspend();
};
colonyTask.customName = (props) => `colony[${props.colonyName}]`;
