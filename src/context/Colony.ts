import { EFlagColors } from "../types/EFlagColors";
import { Process } from "../threading/Process";
import _flatten from "lodash.flatten";

export class Colony {
  public readonly name: string;
  public readonly roomName: string;

  public readonly limbRoomFlagNames: string[];
  public readonly neighbourColonyName: null | string;

  public readonly spawnId: string;

  public readonly creepIds: Id<Creep>[];

  //   * desiredRoleCapacity
  //   * creepsForRole?

  constructor(private process: Process, flags: Flag[], creeps: Creep[]) {
    const colonyFlag = flags.find((x) => x.color === EFlagColors.COLONY_ROOM);
    if (colonyFlag === undefined) {
      throw new Error("Missing colony flag");
    }

    this.name = colonyFlag.name;
    this.roomName = colonyFlag.pos.roomName;
    this.limbRoomFlagNames = flags
      .filter((x) => x.color === EFlagColors.LIMB_ROOM)
      .map((x) => x.name);
    this.neighbourColonyName =
      flags
        .find((x) => x.color === EFlagColors.NEIGHBOUR)
        ?.name.split(":")[1] || null;

    this.spawnId = this.room.find(FIND_MY_STRUCTURES, {
      filter: (x) => x instanceof StructureSpawn,
    })[0]!.id;

    this.creepIds = creeps.map((x) => x.id);
  }

  private get Game(): Game {
    if (this.process.config.ctx.Game === undefined) {
      console.log(1111, Object.keys(this.process.config.ctx));
    }
    return this.process.config.ctx.Game;
  }

  public get room(): Room {
    return this.Game.rooms[this.roomName];
  }

  public get rooms(): Room[] {
    // main room + anything we are remote harvesting in
    return [this.Game.rooms[this.roomName]].concat(
      this.limbRoomFlagNames.map((flagName) => this.Game.flags[flagName].room!)
    );
  }

  public get spawn(): null | StructureSpawn {
    const spawn = Game.spawns[this.spawnId];
    if (spawn === undefined) {
      return null;
    }

    return spawn;
  }

  public get controller(): StructureController {
    return this.room.controller!;
  }

  public get rcl(): number {
    return this.controller.level;
  }

  public get creeps(): Creep[] {
    const game = this.Game;
    return this.creepIds.map((x) => game.getObjectById(x)!);
  }

  public findStructures(filter?: (x: Structure) => boolean): Structure[] {
    return _flatten(
      this.rooms.map((room) => room.find(FIND_MY_STRUCTURES), { filter })
    );
  }
}
