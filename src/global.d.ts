import { IProcessState, Process } from "threading/Process";

declare global {
  // Memory extension samples
  interface Memory {
    process: IProcessState;
  }

  interface CreepMemory {}

  interface Global {}

  var c: {
    process: Process;
    top: () => void;
  };
}

export {};
