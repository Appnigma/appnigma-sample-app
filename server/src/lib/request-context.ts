import { AsyncLocalStorage } from "node:async_hooks";
import type { RequestContext } from "../types/context.types.js";

// Who is signed in, for the request being served. The SDK call log reads it
// without every function passing it along.
const requestContext = new AsyncLocalStorage<RequestContext>();

const currentContext = (): RequestContext | null => requestContext.getStore() ?? null;

export { currentContext, requestContext };
