import { Colony } from "./Colony";

export type ThreadCtx = {
  Game: Game;
  Memory: Memory;
  Colonies: Record<string, Colony>;
};
