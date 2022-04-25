import { Task } from "../../../../threading/Task";
import { EInterrupt } from "../../../../types/EInterrupt";
import { diffArrays } from "../../../../utils/diffArrays";
import { colonyTask } from "../../../colony/colonyTask";

// starts & stops colony threads to match ctx.Colonies

export const colonydTask: Task = function* colonydTask(thread) {
  thread.memo(() => {
    // see what colonies exist
    const colonyNames = Object.keys(thread.ctx.Colonies);

    // see which colony threads are running
    const activeColonyThreads = thread.process.threads
      .filter((x) => x.state.taskName === colonyTask.name)
      .map((x) => x.props.colonyName);

    const diffThreads = diffArrays(activeColonyThreads, colonyNames);

    for (const newColonyName of diffThreads.added) {
      // spawn new colony thread
      thread.startSubThread(
        colonyTask,
        { colonyName: newColonyName },
        {
          parentThreadId: null,
        }
      );
    }
    for (const oldColonyName of diffThreads.removed) {
      // kill any old threads for colonies that don't exist anymore
      const oldThread = thread.process.threads.find(
        (x) =>
          x.state.taskName === colonyTask.name &&
          x.props.colonyName === oldColonyName
      );
      if (oldThread) {
        oldThread.exit();
      } else {
        thread.log("Couldn't find colony thread to kill....", oldColonyName);
      }
    }
  });

  yield thread.suspend();
};

colonydTask.interrupts = (thread) => {
  thread.registerInterrupt(EInterrupt.CONTEXT_UPDATED, () => thread.restart());
};
