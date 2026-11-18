import { appnigma } from "../lib/appnigma.js";
import type { FunctionList, FunctionResult, FunctionRun } from "../types/developer.types.js";

// Your team's own functions, with the shapes of their input and output.
const listFunctions = async (): Promise<FunctionList> => {
  const { functions } = await appnigma.catalog();
  return { functions };
};

// Runs one of them for a workspace: that workspace's own version when it has one.
const runFunction = async (run: FunctionRun): Promise<FunctionResult> =>
  appnigma.run({ endCustomerId: run.endCustomerId, platform: run.platform, functionName: run.functionName, input: run.input });

// The guide for your developers, as markdown, written for your company from
// what is live right now.
const developerGuide = async (): Promise<string> => (await appnigma.guide()).guide;

export { developerGuide, listFunctions, runFunction };
