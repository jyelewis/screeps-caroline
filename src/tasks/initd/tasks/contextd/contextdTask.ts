import { Task } from "../../../../threading/Task";
import { Thread } from "../../../../threading/Thread";
import { EInterrupt } from "../../../../types/EInterrupt";
import { createColonies } from "../../../../context/createColonies";

const contextRefreshInterval = 60; // refresh every 60 ticks, even if flags & creeps haven't changed

let contextLastRefreshed: number = -1;
let lastSeenFlagCount: number = -1;
let lastSeenCreepCount: number = -1;
let lastSeenStructureCount: number = -1;

export const contextdTask: Task = function* contextdTask(thread) {
  // update mutable game objects on the context every tick
  thread.ctx.Game = Game;
  thread.ctx.Memory = Memory;

  if (contextLastRefreshed === thread.process.currentTime) {
    // context has already been refreshed this tick, check again later
    yield thread.sleepTick();
    yield thread.restart();
  }

  const currentFlagCount = Object.keys(thread.ctx.Game.flags).length;
  const currentCreepCount = Object.values(thread.ctx.Game.creeps).filter(
    (x) => !x.spawning
  ).length;
  const currentStructureCount = Object.keys(thread.ctx.Game.structures).length;

  const contextIsStale =
    thread.process.currentTime - contextLastRefreshed >= contextRefreshInterval;

  if (
    contextIsStale ||
    currentCreepCount !== lastSeenCreepCount ||
    currentStructureCount !== lastSeenStructureCount ||
    currentFlagCount !== lastSeenFlagCount
  ) {
    updateContext(thread);
  }

  yield thread.sleepTick();
  yield thread.restart();
};

contextdTask.interrupts = (thread) => {
  // using the interrupt registration function to configure the context initially
  // this runs before any threads have been started
  updateContext(thread);
};

// ------------------------------------------------------------------------------------------

function updateContext(thread: Thread<{}>) {
  // create colonies depends on context being populated...
  thread.process.config.ctx = {
    Game,
    Memory,
    Colonies: {},
  };

  thread.process.config.ctx.Colonies = createColonies(thread.process, Game);

  contextLastRefreshed = thread.process.currentTime;

  lastSeenFlagCount = Object.keys(thread.ctx.Game.flags).length;
  lastSeenCreepCount = Object.keys(thread.ctx.Game.creeps).length;
  lastSeenStructureCount = Object.keys(thread.ctx.Game.structures).length;

  thread.interruptProcess(EInterrupt.CONTEXT_UPDATED);
}
