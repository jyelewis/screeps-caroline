import { Thread, YIELDME } from "./Thread";

export type Task<Props = {}> = ((
  thread: Thread<Props>
) => Generator<typeof YIELDME, void>) & {
  // event handlers are re-registered when the process restarts
  interrupts?: (thread: Thread<Props>) => void;
  version?: number;
  customName?: (props: Props) => string;
};
