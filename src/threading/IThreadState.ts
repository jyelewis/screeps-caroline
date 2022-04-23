// this entire objects must be serializable to memory and
// contain all state needed to resume a task on a fresh note

export interface IThreadState<Props = unknown> {
  id: number;
  name: string;
  parentThreadId: null | number; // the thread that spawned us, or null for root thread

  // task & props
  taskName: string;
  taskVersion: number;
  props: Props;

  // running state
  // how many times this thread has yielded
  programCounter: number;
  memoedValues: any[];
  // children are killed if this thread exists or restarts
  childThreadIds: number[];

  // fields that define whether we can be scheduled
  nextExecution: null | number; // the next tick we expect to schedule this thread, or 0 for ASAP, null for never
  blockingThreadId: undefined | number; // notify this thread when we complete
  blockedOnThreadId: undefined | number; // blocking until this child returns

  // exit state
  isRunning: boolean;

  // metrics
  lastExecution: number; // last time this thread was scheduled
  numRestarts: number;
  numCrashes: number;
}
