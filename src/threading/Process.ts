import { IThreadState } from "./IThreadState";
import { Thread } from "./Thread";
import { Task } from "./Task";
import { ThreadCtx } from "./ThreadCtx";

interface IProcessConfig {
  rootTask: Task;
  tasks: Task<any>[];

  ticksPerSecond: number;

  memoSerialiser: (val: any) => any;
  memoDeserialiser: (val: any) => any;

  readState: () => undefined | IProcessState;
  writeState: (state: IProcessState) => void;

  ctx: ThreadCtx;
}

export interface IProcessState {
  activeThreadStates: Record<string, IThreadState>;
  nextThreadId: number;
}

const createDefaultProcessState = (): IProcessState => ({
  activeThreadStates: {},
  nextThreadId: 0,
});

export class Process {
  private state: IProcessState;

  public readonly threads: Thread[] = [];
  private threadsById = new Map<number, Thread>();
  private threadsByName = new Map<string, Thread>();

  private tasksByName = new Map<string, Task<unknown>>();

  private interruptHandlers = new Map<string, Array<() => void>>();

  // indicates we need to re check all threads
  // (set to true if a thread is created mid-execution)
  private currentExecutionIsDirty = false;

  private isHydrating = false;
  private isExecuting = false;

  public currentTime: number = 0;

  public constructor(public readonly config: IProcessConfig) {
    // index tasks
    for (const task of this.config.tasks) {
      if (!task.name.endsWith("Task")) {
        throw new Error(
          `'${task.name}' is not a valid task function name, must end in Task`
        );
      }
      if (this.tasksByName.get(task.name) !== undefined) {
        throw new Error(
          `'${task.name}' is already registered. Did you copy paste a task definition and forget to rename the function?`
        );
      }

      this.tasksByName.set(task.name, task);
    }

    // fetch existing state, and load
    // we mutate this a lot, for performance reasons
    this.state = this.config.readState() || createDefaultProcessState();

    this.initFromState();
  }

  private initFromState() {
    const isFreshStart = this.state.nextThreadId === 0;

    if (isFreshStart) {
      // start root thread
      const rootThread = Thread.fromTask(this, null, this.config.rootTask, {});
      this.addThread(rootThread);
    } else {
      // resume existing threads
      this.isHydrating = true;
      for (const state of Object.values(this.state.activeThreadStates)) {
        // const thread = Thread.fromState(this, state);
        const thread = new Thread(this, state);
        this.addThread(thread);
      }

      for (const thread of this.threads) {
        thread.hydrateFromState();
      }

      this.isHydrating = false;
    }
  }

  public idForNewThread() {
    const nextThreadId = this.state.nextThreadId;

    this.state.nextThreadId++;

    return nextThreadId;
  }

  // ----- add/remove threads -----------------------------------
  public addThread(thread: Thread<any>) {
    this.threads.push(thread);
    this.threadsById.set(thread.id, thread);
    this.threadsByName.set(thread.name, thread);

    this.state.activeThreadStates[thread.id] = thread.state;
  }

  public removeThread(thread: Thread<any>) {
    this.threads.splice(this.threads.indexOf(thread), 1);
    this.threadsById.delete(thread.id);
    this.threadsByName.delete(thread.name);
    delete this.state.activeThreadStates[thread.id];
  }

  // ----- retrieval methods -----------------------------------
  public getThreadById(threadId: number): Thread {
    const thread = this.threadsById.get(threadId);
    if (thread === undefined) {
      throw new Error(`No thread for id '${threadId}'`);
    }

    return thread;
  }

  public taskIsRegistered(task: Task<any>) {
    return this.tasksByName.get(task.name) === task;
  }

  public getTaskByName<Props, ReturnType>(taskName: string): Task<Props> {
    const task = this.tasksByName.get(taskName);
    if (task === undefined) {
      throw new Error(`No task for name '${taskName}'`);
    }

    return task as unknown as Task<Props>;
  }

  public getThreadByName(threadName: string): Thread {
    const thread = this.threadsByName.get(threadName);
    if (thread === undefined) {
      throw new Error(`No thread for name '${threadName}'`);
    }

    return thread;
  }

  public markCurrentExecutionDirty() {
    if (!this.isExecuting && !this.isHydrating) {
      throw new Error("Process is not currently executing");
    }
    this.currentExecutionIsDirty = true;
  }

  public execute(currentTime: number) {
    this.currentTime = currentTime;

    this.isExecuting = true;

    do {
      this.currentExecutionIsDirty = false;
      for (const thread of this.threads) {
        thread.execute();
      }
    } while (this.currentExecutionIsDirty);

    this.isExecuting = false;

    // save out state
    this.config.writeState(this.state);
  }

  // ---- interrupts -----------------------

  public registerInterrupt(eventName: string, handler: () => void) {
    const handlers = this.interruptHandlers.get(eventName);
    if (handlers === undefined) {
      this.interruptHandlers.set(eventName, [handler]);
    } else {
      handlers.push(handler);
    }
  }

  public unregisterInterrupt(eventName: string, handler: () => void) {
    const handlers = this.interruptHandlers.get(eventName);
    if (handlers !== undefined) {
      const updatedHandlers = handlers.filter((x) => x !== handler);
      this.interruptHandlers.set(eventName, updatedHandlers);
    }
  }

  public interrupt(eventName: string) {
    const handlers = this.interruptHandlers.get(eventName);
    if (handlers === undefined) {
      return;
    }

    for (const handler of handlers) {
      handler();
    }
  }

  public reset() {
    // terminate all top level threads
    // this will automatically terminate sub threads
    for (const thread of this.threads) {
      if (thread.state.parentThreadId === null) {
        thread.exit();
      }
    }

    // reset our internal state
    this.state = createDefaultProcessState();
    this.config.writeState(this.state);

    // start up new root thread
    this.initFromState();
  }
}
