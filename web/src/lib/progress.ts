// Remembers, in this browser only, the getting-started steps the server cannot know about.
const PREFIX = "sample-app-progress:";

const markDone = (step: string): void => {
  try {
    window.localStorage.setItem(`${PREFIX}${step}`, "1");
  } catch {
    // Private windows can refuse storage; the checklist then just stays unticked.
    return;
  }
};

const isDone = (step: string): boolean => {
  try {
    return window.localStorage.getItem(`${PREFIX}${step}`) === "1";
  } catch {
    return false;
  }
};

export { isDone, markDone };
