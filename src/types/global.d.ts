import { IProcessState, Process } from "threading/Process";
import { Thread } from "../threading/Thread";

declare global {
  // Memory extension samples
  interface Memory {
    process: IProcessState;
  }

  interface CreepMemory {
    colonyName: string;
  }

  interface Global {}

  var c: {
    process: Process;
    top: () => void;
    thread: (threadName: string) => Thread;
    reset: () => void;
  };
}

export {};
