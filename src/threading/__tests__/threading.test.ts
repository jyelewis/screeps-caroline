import { IProcessState, Process } from "../Process";
import { Task } from "../Task";

jest.setTimeout(1);

function createProcess(
  tasks: Task<any>[],
  initialState?: IProcessState,
  initialTick = 0
) {
  let tick = initialTick;
  let state: { current: undefined | IProcessState } = {
    current: initialState,
  };

  const process = new Process({
    tasks: tasks,
    rootTask: tasks[0],

    ticksPerSecond: 1,
    memoSerialiser: (x) => x,
    memoDeserialiser: (x) => x,

    readState: () => state.current,
    writeState: (newState) => (state.current = newState),

    ctx: {
      exampleService: 123,
    } as any,
  });

  const run = (iterations: number) => {
    for (let i = 0; i < iterations; i++) {
      process.execute(tick);
      tick++;
    }
  };

  return [run, process, state] as const;
}

describe("threading", () => {
  it("Runs a single, simple thread", () => {
    let counter = 0;
    const mainTask: Task = function* mainTask(thread) {
      counter++;

      yield thread.sleepTick();
      yield thread.restart();
    };

    const [run] = createProcess([mainTask]);

    run(100);

    expect(counter).toEqual(100);
  });

  it("Sleeps for a fixed number of ticks", () => {
    let counter = 0;
    const mainTask: Task = function* mainTask(thread) {
      counter++;

      yield thread.sleepTicks(10);
      yield thread.restart();
    };

    const [run] = createProcess([mainTask]);

    run(100);

    expect(counter).toEqual(10);
  });

  it("Suspends & resumes threads", () => {
    let counter = 0;
    const mainTask: Task = function* mainTask(thread) {
      counter++;

      yield thread.sleepTick();
      yield thread.restart();
    };

    const [run, process] = createProcess([mainTask]);
    const thread = process.getThreadByName("main");

    run(10);
    expect(counter).toEqual(10);

    thread.suspend();

    run(10);
    expect(counter).toEqual(10);

    thread.resume();
    run(10);
    expect(counter).toEqual(20);
  });

  it("Forks to a sub-thread with do", () => {
    let counter = 0;
    const mainTask: Task = function* mainTask(thread) {
      yield thread.do(subTask, { inc: 1 });
      yield thread.restart();
    };

    const subTask: Task<{ inc: number }> = function* subTask(thread) {
      counter += thread.props.inc;

      yield thread.sleepTick();
      yield thread.exit();
    };

    const [run] = createProcess([mainTask, subTask]);

    run(100);

    expect(counter).toEqual(100);
  });

  it("Executes a loop", () => {
    let counter = 0;
    const mainTask: Task = function* mainTask(thread) {
      let subCounter = 0;

      // a 0
      // a 1
      // b 2
      // c 3
      // d 4
      // e 5
      // e counter++
      // e restart
      // e subCounter = 0
      // e enter loop
      // e 0
      // e 1
      yield thread.loop(() => {
        subCounter++;
        return subCounter < 5;
      });

      counter++;

      // without this we immediately jump back into the loop and run 2 iterations in the same tick
      // which is fine, but not what we want here
      yield thread.sleepTick();

      yield thread.restart();
    };

    const [run] = createProcess([mainTask]);

    run(50);

    expect(counter).toEqual(10);
  });

  it("Forks multiple sub-threads and joins them all", () => {
    let counter = 0;
    const mainTask: Task = function* mainTask(thread) {
      const t1 = thread.startSubThread(subTask, { inc: 1, loops: 10 });
      const t2 = thread.startSubThread(subTask, { inc: 2, loops: 10 });
      const t3 = thread.startSubThread(subTask, { inc: 3, loops: 10 });

      yield thread.join(t1);
      yield thread.join(t2);
      yield thread.join(t3);

      throw new Error("Please stop me :)");
    };

    const subTask: Task<{ inc: number; loops: number }> = function* subTask(
      thread
    ) {
      let subCounter = 0;
      yield thread.loop(() => {
        counter += thread.props.inc;

        subCounter++;
        return subCounter <= thread.props.loops;
      });

      yield thread.exit();
    };

    const [run] = createProcess([mainTask, subTask]);

    run(10);

    expect(counter).toEqual((1 + 2 + 3) * 10);
  });

  it("Kills child threads if the parent exists", () => {
    const mainTask: Task = function* mainTask(thread) {
      thread.startSubThread(subTask, {});
      yield thread.sleepTicks(2);
      yield thread.exit();
    };

    const subTask: Task = function* subTask(thread) {
      yield thread.suspend();
    };

    const [run, process] = createProcess([mainTask, subTask]);

    run(1);

    const mainThread = process.getThreadByName("main");
    const subThread = process.getThreadByName("main -> sub");

    run(1);

    expect(mainThread.state.isRunning).toEqual(true);
    expect(subThread.state.isRunning).toEqual(true);

    run(1);

    expect(mainThread.state.isRunning).toEqual(false);
    expect(subThread.state.isRunning).toEqual(false);
  });

  it("Correctly resumes execution after suspending", () => {
    let counter = 0;
    const mainTask: Task = function* mainTask(thread) {
      const t1 = thread.startSubThread(subTask, { inc: 1, loops: 10 });
      const t2 = thread.startSubThread(subTask, { inc: 2, loops: 10 });
      const t3 = thread.startSubThread(subTask, { inc: 3, loops: 10 });

      yield thread.join(t1);
      yield thread.join(t2);
      yield thread.join(t3);

      throw new Error("Please stop me :)");
    };

    const subTask: Task<{ inc: number; loops: number }> = function* subTask(
      thread
    ) {
      let subCounter = 0;
      yield thread.loop(() => {
        counter += thread.props.inc;

        subCounter++;
        return subCounter <= thread.props.loops;
      });

      yield thread.exit();
    };

    const [run1, , state1] = createProcess([mainTask, subTask]);

    run1(5);

    expect(counter).toEqual((1 + 2 + 3) * 5);

    const [run2] = createProcess([mainTask, subTask], state1.current, 5);

    run2(5);

    expect(counter).toEqual((1 + 2 + 3) * 10);
  });

  it("Serialises memo'ed values", () => {
    let obj: any;
    const mainTask: Task = function* mainTask(thread) {
      obj = thread.memo(() => ({
        hello: "world",
      }));

      yield thread.suspend();
    };
    // ----------------------------------------

    let state: { current: undefined | IProcessState } = {
      current: undefined,
    };

    const process1 = new Process({
      tasks: [mainTask],
      rootTask: mainTask,

      ticksPerSecond: 1,
      memoSerialiser: (x) => ({
        ...x,
        _seralised: true,
      }),
      memoDeserialiser: (x) => ({
        ...x,
        _deseralised: true,
      }),

      readState: () => state.current,
      writeState: (newState) => (state.current = newState),

      ctx: {} as any,
    });

    process1.execute(0);
    expect(obj).toEqual({
      hello: "world",
    });
    expect(state.current?.activeThreadStates[0].memoedValues[0]).toEqual({
      hello: "world",
      _seralised: true,
    });

    const process2 = new Process({
      tasks: [mainTask],
      rootTask: mainTask,

      ticksPerSecond: 1,
      memoSerialiser: (x) => ({
        ...x,
        _seralised: true,
      }),
      memoDeserialiser: (x) => ({
        ...x,
        _deseralised: true,
      }),

      readState: () => state.current,
      writeState: (newState) => (state.current = newState),

      ctx: {} as any,
    });

    process2.execute(1);
    expect(obj).toEqual({
      hello: "world",
      _seralised: true,
      _deseralised: true,
    });
  });

  it("Can spawn child threads attached to other parents", () => {
    const mainTask: Task = function* mainTask(thread) {
      const secondRootThread = thread.startSubThread(
        secondRootTask,
        {},
        {
          parentThreadId: null,
        }
      );

      thread.startSubThread(
        subTask,
        {},
        {
          parentThreadId: secondRootThread.id,
        }
      );

      yield thread.suspend();
    };

    const secondRootTask: Task = function* secondRootTask(thread) {
      yield thread.suspend();
    };

    const subTask: Task = function* subTask(thread) {
      yield thread.suspend();
    };

    const [run, process] = createProcess([mainTask, secondRootTask, subTask]);

    run(1);

    const mainThread = process.getThreadByName("main");
    const secondRootThread = process.getThreadByName("secondRoot");
    const subThread = process.getThreadByName("secondRoot -> sub");

    run(1);

    expect(mainThread.state.isRunning).toEqual(true);
    expect(secondRootThread.state.isRunning).toEqual(true);
    expect(subThread.state.isRunning).toEqual(true);

    expect(secondRootThread.state.parentThreadId).toEqual(null);
    expect(subThread.state.parentThreadId).toEqual(secondRootThread.id);
  });

  it.todo("Bubbles crash to thread blocked on this");

  it.todo("Restarts if thread crashes & no one is blocking");

  it("Interrupts", () => {
    const mainTask: Task = function* mainTask(thread) {
      thread.startSubThread(counterTask, {});
      thread.startSubThread(emitterTask, {});

      yield thread.suspend();
    };

    let counter = 0;
    const counterTask: Task = function* counterTask(thread) {
      counter++;

      yield thread.suspend();
    };
    counterTask.interrupts = (thread) => {
      thread.registerInterrupt("COUNT", () => thread.restart());
    };

    const emitterTask: Task = function* emitterTask(thread) {
      thread.interruptProcess("COUNT");

      yield thread.sleepTicks(5);

      yield thread.restart();
    };

    const [run] = createProcess([mainTask, counterTask, emitterTask]);

    run(20);

    // start with 1, plus extra every 5 ticks
    expect(counter).toEqual(5);
  });

  it("Provides context", () => {
    const mainTask: Task = function* mainTask(thread) {
      expect(thread.ctx).toEqual({
        exampleService: 123,
      });

      yield thread.suspend();
    };

    const [run] = createProcess([mainTask]);

    run(1);
  });
});
