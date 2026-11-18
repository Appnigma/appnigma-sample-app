import type { LogicEntry, LogicProblem } from "@appnigma/sdk";

// "round-deal-amounts" reads as "Round deal amounts".
const titleOf = (name: string): string => {
  const words = name.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const switchWordsOf = (entry: LogicEntry): string => {
  if (!entry.alwaysOn) return "Runs when it is called";
  return entry.on ? "On" : "Off";
};

const problemsInWords = (problems: LogicProblem[]): string =>
  problems.length === 1 ? "It found one thing to fix." : `It found ${problems.length} things to fix.`;

export { problemsInWords, switchWordsOf, titleOf };
