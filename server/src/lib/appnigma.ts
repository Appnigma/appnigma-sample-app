import { Appnigma } from "@appnigma/sdk";
// Loads .env first: the SDK reads APPNIGMA_SDK_KEY from the environment when
// the client is made, whichever module happens to import this one first.
import "../config/env.js";
import { recordSdkCalls } from "./sdk-call-log.js";

const appnigma = new Appnigma({ fetchImplementation: recordSdkCalls(fetch) });

export { appnigma };
