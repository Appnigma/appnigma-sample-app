import { Appnigma } from "@appnigma/sdk";
import { recordSdkCalls } from "./sdk-call-log.js";

// The one Appnigma client for the whole server. It reads your key from
// APPNIGMA_SDK_KEY, so the key never appears in code. Every file in services/
// imports this client; nothing else in the app talks to Appnigma.
//
// fetchImplementation is optional. Here it only records each call for the
// "Under the hood" panel. In your own app, `new Appnigma()` is all you need.
const appnigma = new Appnigma({ fetchImplementation: recordSdkCalls(fetch) });

export { appnigma };
