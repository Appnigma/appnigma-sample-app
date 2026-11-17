import { z } from "zod";

const platformParamSchema = z.string().regex(/^[a-z0-9-]{2,40}$/, "is not a platform key");

const callIdParamSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "is not a call id");

const signInSchema = z.object({ account: z.string().trim().min(1).max(255) });

const newContactSchema = z.object({
  platform: platformParamSchema,
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email(),
});

export { callIdParamSchema, newContactSchema, platformParamSchema, signInSchema };
