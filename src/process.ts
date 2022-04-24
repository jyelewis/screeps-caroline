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
function memoSerialiser(data: any): undefined | ISerialisedValue {
  if (data === undefined) {
    return undefined;
  }

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
  if (typeof data !== "object" || data === null) {
    return undefined;
  }

  if (data.type === "RAW") {
    return data.value;
  }

  const gameObjectId = data.value;

  let gameObject = Game.getObjectById(gameObjectId);
  if (gameObject === null) {
    throw new Error(`GameObject '${gameObjectId}' not found`);
  }

  return new Proxy<any>(
    {},
    {
      get(target: any, prop: string): any {
        let gameObject = Game.getObjectById(gameObjectId);
        if (gameObject === null) {
          throw new Error(
            `GameObject '${gameObjectId}' does not exist anymore`
          );
        }

        return (gameObject as any)[prop];
      },
    }
  );
}
