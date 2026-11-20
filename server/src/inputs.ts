import { z } from "zod";

// The checks several routes share. Each route checks the rest of its input where it is.

const platformSchema = z.string().regex(/^[a-z0-9-]{2,40}$/, "is not a platform key");

const jsonObjectSchema = z.record(z.string(), z.json());

export { jsonObjectSchema, platformSchema };
