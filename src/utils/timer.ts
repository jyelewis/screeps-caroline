let timerMsg: null | string = null;
let timerStart: null | number = null;

export const timer = {
  start: (msg: string = "Timer") => {
    timerMsg = msg;
    timerStart = Game.cpu.getUsed();
  },
  end: () => {
    if (timerStart === null) {
      console.log("timer.end() called before timer.start()");
      return;
    }

    const timeDiff = Game.cpu.getUsed() - timerStart;
    console.log(`${timerMsg}: ${timeDiff}ms`);

    timerStart = null;
    timerMsg = null;
  },
};
