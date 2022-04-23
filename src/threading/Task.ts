import { Thread } from "./Thread";

export type Task<Props = {}> = ((
  thread: Thread<Props>
) => Generator<symbol, void>) & {
  // event handlers are re-registered when the process restarts
  interrupts?: (thread: Thread<Props>) => void;
  version?: number;
  customName?: (props: Props) => string;
};
