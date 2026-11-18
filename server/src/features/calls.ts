import { Router } from "express";
import { z } from "zod";
import { appnigma } from "../appnigma.js";
import { route } from "../errors.js";
import { requireSignedIn, signedInWorkspace } from "../session.js";
import type { RecordedCall, TranscriptPart } from "../types.js";

// The Calls page: recorded calls next to your customers, from Gong. Actions
// are ready-made jobs on a platform that Appnigma writes and keeps up to date.
// Their output is checked here against the shape this page expects;
// `npx appnigma types` can also write typed definitions for every action.

// Recorded calls come from Gong in this sample.
const CALL_PLATFORM = "gong";

const callIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "is not a call id");

const callListOutputSchema = z.object({
  calls: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      startedAt: z.string(),
      durationSeconds: z.number(),
    }),
  ),
});

const transcriptOutputSchema = z.object({
  transcript: z.array(
    z.object({
      speakerId: z.string(),
      speakerName: z.string().optional(),
      sentences: z.array(z.object({ start: z.number(), text: z.string() })),
    }),
  ),
});

const callsRouter = Router();

callsRouter.use(requireSignedIn);

callsRouter.get(
  "/",
  route(async (_request, response) => {
    const { output } = await appnigma.actions.run({ endCustomerId: signedInWorkspace(), platform: CALL_PLATFORM, action: "list-calls", input: {} });
    const calls: RecordedCall[] = callListOutputSchema.parse(output).calls;
    response.json({ calls });
  }),
);

callsRouter.get(
  "/:callId/transcript",
  route(async (request, response) => {
    const callId = callIdSchema.parse(request.params.callId);
    const { output } = await appnigma.actions.run({ endCustomerId: signedInWorkspace(), platform: CALL_PLATFORM, action: "get-call-transcript", input: { callId } });
    const transcript: TranscriptPart[] = transcriptOutputSchema.parse(output).transcript;
    response.json({ transcript });
  }),
);

export { CALL_PLATFORM, callsRouter };
