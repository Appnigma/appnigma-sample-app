import { Appnigma } from "@appnigma/sdk";
// Loads .env first: the SDK reads APPNIGMA_SDK_KEY from the environment when
// the client is made, whichever module happens to import this one first.
import "./env.js";
import { recordSdkCalls } from "./under-the-hood.js";

// The one SDK client the whole server uses. The fetch it is given only writes
// each call down for the "Under the hood" panel; your app can leave it out.
const appnigma = new Appnigma({ fetchImplementation: recordSdkCalls(fetch) });

export { appnigma };
