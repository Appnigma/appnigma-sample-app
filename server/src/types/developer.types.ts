import type { FunctionEntry, RunOutput } from "@appnigma/sdk";
import type { z } from "zod";
import type { functionRunSchema } from "../schemas/request.schemas.js";

type FunctionRun = z.infer<typeof functionRunSchema>;

type FunctionList = {
  functions: FunctionEntry[];
};

type FunctionResult = RunOutput;

export type { FunctionList, FunctionResult, FunctionRun };
