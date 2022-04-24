import { IThreadState } from "./IThreadState";
import { Task } from "./Task";
import { Process } from "./Process";
import { randomBetween } from "../utils/randomBetween";
import { ThreadCtx } from "./ThreadCtx";

export const YIELDME = Symbol("YIELDME");

export class Thread<Props = unknown> {
  // ----- internal state -----------------------------------
  private task: Task<Props>;
  private taskGenerator: Generator<symbol, void> | undefined;

  private loopFn: (() => boolean) | undefined = undefined;

  // true while we are fast forwarding through a function
  private isHydrating: boolean = false;
  private hydratingNextMemoIndex: number = 0;

  private interruptHandlers: Record<string, () => void> = {};

  public showLogs = true;

  // ----- constructors -----------------------------------
  public constructor(
    public process: Process,
    public readonly state: IThreadState<Props>
  ) {
    this.task = this.process.getTaskByName(state.taskName);

    // register interrupts
    if (this.task.interrupts) {
      this.task.interrupts(this);
    }
  }

  public static fromTask<Props, ReturnType>(
    process: Process,
    parentThread: null | Thread<any>,
    task: Task<Props>,
    props: Props
  ): Thread<Props> {
    // check this task is registered
    if (!process.taskIsRegistered(task)) {
      throw new Error(
        `Cannot spawn thread for task '${task.name}', it is not registered in process config`
      );
    }

    const nameSuffix = task.customName
      ? task.customName(props)
      : // name of function without "task" suffix
        task.name.substring(0, task.name.length - 4);
    const name = parentThread
      ? `${parentThread.name}.${nameSuffix}`
      : nameSuffix;

    // construct a new thread state for this task
    const newThread = new Thread<Props>(process, {
      id: process.idForNewThread(),
      name,
      parentThreadId: parentThread === null ? null : parentThread.id,

      taskName: task.name,
      taskVersion: task.version || 0,
      props,

      programCounter: 0,
      memoedValues: [],
      childThreadIds: [],

      nextExecution: 0,
      blockingThreadId: undefined,
      blockedOnThreadId: undefined,

      isRunning: true,

      lastExecution: 0,
      numRestarts: 0,
      numCrashes: 0,
    });

    // attach child to parent
    if (parentThread) {
      parentThread.state.childThreadIds.push(newThread.id);
    }

    return newThread;
  }

  // called from Process when hydrating after all threads have been constructed
  public hydrateFromState() {
    if (this.taskGenerator !== undefined) {
      throw new Error("Generator already exists, cannot hydrate");
    }

    this.isHydrating = true;
    this.hydratingNextMemoIndex = 0;

    // call our function
    this.taskGenerator = this.task(this);

    for (let pc = 0; pc < this.state.programCounter; pc++) {
      // if our last call set a loop, we are continuing so clear it
      this.loopFn = undefined;

      // run until we yield again to match programCounter
      this.taskGenerator.next();
    }

    this.isHydrating = false;
    this.hydratingNextMemoIndex = 0;
  }

  // ----- execution -----------------------------------
  public execute() {
    // check for a version update
    const runningVersion = this.state.taskVersion;
    const codeVersion = this.task.version || 0;
    if (runningVersion !== codeVersion) {
      // underlying code has been updated, restart thread
      this.log("Code updated, restarting");
      this.state.taskVersion = codeVersion;

      this.restart();
    }

    const canExecute = () =>
      this.state.isRunning &&
      this.state.nextExecution !== null &&
      this.state.nextExecution <= this.process.currentTime &&
      this.state.blockedOnThreadId === undefined;

    while (canExecute()) {
      try {
        // reset our next execution/sleep
        this.state.nextExecution = 0;

        if (this.loopFn !== undefined) {
          // run the loop once per tick until it returns false
          if (this.loopFn()) {
            this.sleepTick();
            break;
          } else {
            this.loopFn = undefined;
          }
        }

        if (this.taskGenerator === undefined) {
          // call the task function to create the generator
          this.taskGenerator = this.task(this);
        }

        // execute until the next yield
        const iterResult = this.taskGenerator.next();

        this.state.programCounter++;

        // check that thread did not return prematurely
        if (iterResult.done && this.taskGenerator && this.state.isRunning) {
          return this.handleCrash(
            "Thread task returned without restarting or exiting"
          );
        }

        if (iterResult.value !== YIELDME) {
          return this.handleCrash(
            "Thread task yielded or returns an invalid value"
          );
        }
      } catch (e: any) {
        this.handleCrash(e);
      }

      // collect some stats
      this.state.lastExecution = this.process.currentTime;
    }
  }

  private handleCrash(error: string | Error) {
    this.state.numCrashes++;
    this.log("CRASHED - ", error);

    if (this.state.blockingThreadId !== undefined) {
      // crash us
      this.state.isRunning = false;
      this.process.removeThread(this);

      // crash any thread waiting on us
      const blockingThread = this.process.getThreadById(
        this.state.blockingThreadId
      );
      blockingThread.handleCrash("Sub-thread crashed");
    } else {
      // else if no one is waiting on us, restart
      this.restart();
    }
  }

  // umm
  private killAllChildren() {
    for (const childThreadId of this.state.childThreadIds) {
      const childThread = this.process.getThreadById(childThreadId);
      childThread.state.parentThreadId = null;
      childThread.exit();
    }
  }

  // ----- helper getters -----------------------------------
  get id() {
    return this.state.id;
  }

  get name() {
    return this.state.name;
  }

  get props() {
    return this.state.props;
  }

  get ctx(): ThreadCtx {
    return this.process.config.ctx;
  }

  // ----- helper functions (no yield) -----------------------------------
  public registerInterrupt(eventName: string, handler: () => void) {
    if (eventName in this.interruptHandlers) {
      throw new Error(
        `Interrupt '${eventName}' already has a handler registered`
      );
    }

    this.interruptHandlers[eventName] = handler;
    this.process.registerInterrupt(eventName, handler);
  }

  public interruptProcess(eventName: string) {
    this.process.interrupt(eventName);
  }

  public log(...msg: any[]): void {
    if (this.isHydrating) {
      // skip log lines while re-hydrating
      return;
    }
    if (!this.showLogs) {
      return;
    }

    console.log(`${this.state.name}:`, ...msg);
  }

  public memo<T>(memoFn: () => T): T {
    if (this.isHydrating) {
      // fast forward

      // return value from memoedValues, rather than re-executing function
      const memoedValue = this.state.memoedValues[this.hydratingNextMemoIndex];
      const value = this.process.config.memoDeserialiser(memoedValue);
      this.hydratingNextMemoIndex++;

      return value;
    }

    const value = memoFn();

    const memoedValue = this.process.config.memoSerialiser(value);
    this.state.memoedValues.push(memoedValue);

    return value;
  }

  public startSubThread<SubTaskProps>(
    task: Task<SubTaskProps>,
    props: SubTaskProps,
    options: {
      parentThreadId?: null | number;
      startSuspended?: false | true;
    } = {}
  ) {
    // support re-hydrating, and re-attaching to the new thread object
    const threadId = this.memo(() => {
      let parentThread: Thread<any> | null = null;
      if (options.parentThreadId === undefined) {
        parentThread = this;
      } else if (typeof options.parentThreadId === "number") {
        parentThread = this.process.getThreadById(options.parentThreadId);
      }

      const newThread = Thread.fromTask(
        this.process,
        parentThread,
        task,
        props
      );

      this.process.addThread(newThread);

      if (options.startSuspended === true) {
        newThread.suspend();
      } else {
        // new thread added, make sure it gets called this tick
        this.process.markCurrentExecutionDirty();
      }

      return newThread.id;
    });

    return this.process.getThreadById(threadId);
  }

  public resume() {
    this.state.nextExecution = 0;
  }

  // ----- helper functions (yield required) -----------------------------------
  public restart() {
    if (!this.state.isRunning) {
      throw new Error("Cannot restart thread that isn't running");
    }

    this.killAllChildren();

    this.state.numRestarts++;
    this.taskGenerator = undefined;

    // reset state
    this.state.programCounter = 0;
    this.state.memoedValues = [];
    this.state.nextExecution = 0;
    this.loopFn = undefined;

    // restart may have been called from an interrupt,
    // requiring we re-schedule this thread during this tick
    this.process.markCurrentExecutionDirty();

    return YIELDME;
  }

  public exit() {
    if (this.isHydrating) {
      throw new Error("Unexpected exit during hydration");
    }

    this.state.isRunning = false;
    this.process.removeThread(this);

    // remove ourselves from parent threads children list
    if (this.state.parentThreadId !== null) {
      const parentThread = this.process.getThreadById(
        this.state.parentThreadId
      );
      parentThread.state.childThreadIds.splice(
        parentThread.state.childThreadIds.indexOf(this.state.id),
        1
      );
    }

    // kill any child threads
    this.killAllChildren();

    // notify any thread we are blocking & process
    if (this.state.blockingThreadId !== undefined) {
      // unblock this thread
      const blockingThread = this.process.getThreadById(
        this.state.blockingThreadId
      );

      blockingThread.state.blockedOnThreadId = undefined;

      // might need to resume this parent process if it hasn't already run
      this.process.markCurrentExecutionDirty();
    }

    // unregister interrupt handlers
    for (const eventName in this.interruptHandlers) {
      this.process.unregisterInterrupt(
        eventName,
        this.interruptHandlers[eventName]
      );
    }

    return YIELDME;
  }

  public suspend() {
    this.state.nextExecution = null;

    return YIELDME;
  }

  public sleepTicks(ticks: number): symbol {
    if (this.isHydrating) {
      // fast forward
      return YIELDME;
    }

    this.state.nextExecution = this.process.currentTime + ticks;

    return YIELDME;
  }

  public sleepTick() {
    return this.sleepTicks(1);
  }

  public sleepSeconds(seconds: number) {
    const ticks = Math.floor(seconds / this.process.config.tickPeriod);

    // add jitter to these ticks to knock threads out of sync
    return this.sleepTicks(ticks + randomBetween(-2, 2));
  }

  public loop(loopFn: () => boolean) {
    // note: loop will only delay a tick BETWEEN loops, not before entering or after finishing

    // store even while hydrating, otherwise we lose reference to this loop
    this.loopFn = loopFn;

    return YIELDME;
  }

  public do<SubTaskProps>(task: Task<SubTaskProps>, props?: SubTaskProps) {
    if (this.isHydrating) {
      // fast forward
      return YIELDME;
    }

    const newThread = this.startSubThread<SubTaskProps>(
      task,
      props || ({} as any)
    );
    return this.join(newThread);
  }

  public join(threadToJoin: Thread<any>) {
    if (this.isHydrating) {
      // fast forward
      return YIELDME;
    }

    if (!threadToJoin.state.isRunning) {
      // thread we want to join has already exited
      return YIELDME;
    }

    threadToJoin.state.blockingThreadId = this.id;
    this.state.blockedOnThreadId = threadToJoin.id;

    return YIELDME;
  }
}
