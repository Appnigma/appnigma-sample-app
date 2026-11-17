import { z } from "zod";

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

export { callListOutputSchema, transcriptOutputSchema };
