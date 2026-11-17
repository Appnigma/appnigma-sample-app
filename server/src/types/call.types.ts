import type { z } from "zod";
import type { callListOutputSchema, transcriptOutputSchema } from "../schemas/action.schemas.js";

type RecordedCall = z.infer<typeof callListOutputSchema>["calls"][number];

type TranscriptPart = z.infer<typeof transcriptOutputSchema>["transcript"][number];

export type { RecordedCall, TranscriptPart };
