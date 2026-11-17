import { CALL_PLATFORM } from "../constants/crm.js";
import { appnigma } from "../lib/appnigma.js";
import { callListOutputSchema, transcriptOutputSchema } from "../schemas/action.schemas.js";
import type { RecordedCall, TranscriptPart } from "../types/call.types.js";

// Actions are ready-made jobs on a platform that Appnigma writes and keeps up
// to date. Their output is checked here against the shape this page expects;
// `npx appnigma types` can also write typed definitions for every action.
const listCalls = async (endCustomerId: string): Promise<RecordedCall[]> => {
  const { output } = await appnigma.actions.run({ endCustomerId, platform: CALL_PLATFORM, action: "list-calls", input: {} });
  return callListOutputSchema.parse(output).calls;
};

const callTranscript = async (endCustomerId: string, callId: string): Promise<TranscriptPart[]> => {
  const { output } = await appnigma.actions.run({ endCustomerId, platform: CALL_PLATFORM, action: "get-call-transcript", input: { callId } });
  return transcriptOutputSchema.parse(output).transcript;
};

export { callTranscript, listCalls };
