import { Colony } from "./Colony";
import { addToIndexMapArray } from "../utils/addToIndexMapArray";
import { Process } from "../threading/Process";

export function createColonies(
  process: Process,
  Game: Game
): Record<string, Colony> {
  // group flags by their colonyName prefix
  const flags = new Map<string, Flag[]>();
  for (const flag of Object.values(Game.flags)) {
    addToIndexMapArray(flags, flag.name.split(":")[0], flag);
  }

  // index creeps
  const creeps = new Map<string, Creep[]>();
  for (const creep of Object.values(Game.creeps)) {
    addToIndexMapArray(creeps, creep.memory.colonyName, creep);
  }

  // create new colony names with their own entities
  const colonies: Record<string, Colony> = {};
  for (const colonyName of flags.keys()) {
    colonies[colonyName] = new Colony(
      process,
      flags.get(colonyName)!,
      creeps.get(colonyName) || []
    );
  }

  return colonies;
}
