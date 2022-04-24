import { Process } from "./threading/Process";
import { initdTask } from "./tasks/initd/initdTask";
import { allTasks } from "./tasks";
import { isSimulator } from "./utils/isSimulator";

export let process: Process;
export function createProcess() {
  process = new Process({
    tasks: allTasks(),
    rootTask: initdTask,

    readState: () => Memory.process,
    writeState: (newState) => (Memory.process = newState),

    memoDeserialiser,
    memoSerialiser,

    // from https://screeps.com/a/#!/shards
    tickPeriod: isSimulator ? 1 : 3.3,

    ctx: {
      Game,
      Memory,
      Colonies: {}, // will be mutated & updated by colonyd
    },
  });
}

interface ISerialisedValue {
  type: "SCREEPS_OBJ" | "RAW";
  value: any;
}
function memoSerialiser(data: any): ISerialisedValue {
  if (typeof data === "object" && data !== null && "id" in data) {
    // this is most likely a screeps game object
    // we can't store these in memory, so just store a reference to it
    return {
      type: "SCREEPS_OBJ",
      value: data.id,
    };
  }

  return {
    type: "RAW",
    value: data,
  };
}

function memoDeserialiser(data: ISerialisedValue): any {
  if (data.type === "SCREEPS_OBJ") {
    return Game.getObjectById(data.value);
  }

  return data.value;
}
