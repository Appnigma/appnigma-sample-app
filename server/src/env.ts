import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// server/src and server/dist are both two folders below the repository root.
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const envFile = path.join(repositoryRoot, ".env");

if (existsSync(envFile)) process.loadEnvFile(envFile);

const settingsSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4700),
  // Where your customers reach this app: http://localhost:4701 with npm run dev,
  // http://localhost:4700 with npm start. Connecting a platform sends them back here.
  PUBLIC_URL: z.url().default("http://localhost:4701"),
  // Appnigma sends people back only to an https address. When PUBLIC_URL is not
  // https, such as on your own machine, set an https page that forwards them on:
  // they return to it with ?to=<this app's address> and the result.
  RETURN_PAGE_URL: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .pipe(z.url().refine((value) => value.startsWith("https://"), "should be an https address").optional()),
  // The SDK reads the key itself. It is checked here only so a missing key
  // stops the app at start, with a clear message, rather than at the first call.
  APPNIGMA_SDK_KEY: z
    .string({ error: "is missing. Put your Appnigma SDK key in .env" })
    .trim()
    .min(1, "is missing. Put your Appnigma SDK key in .env"),
  // The secret webhooks.create answered, once, for this app's webhook. Without
  // it, only a webhook made from the Admin page since this server started can
  // be checked.
  APPNIGMA_WEBHOOK_SECRET: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  PRODUCT_NAME: z.string().trim().min(1).default("Acme Desk"),
  BRAND_COLOR: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#4f46e5"),
});

const parsed = settingsSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues.map((issue) => `  ${issue.path.join(".")} ${issue.message}`).join("\n");
  console.error(`The app cannot start. Fix these in .env:\n${problems}`);
  process.exit(1);
}

const settings = parsed.data;

const env = {
  port: settings.PORT,
  publicUrl: settings.PUBLIC_URL.replace(/\/+$/, ""),
  returnPageUrl: settings.RETURN_PAGE_URL ?? null,
  webhookSecret: settings.APPNIGMA_WEBHOOK_SECRET ?? null,
  productName: settings.PRODUCT_NAME,
  brandColor: settings.BRAND_COLOR,
  webDistDirectory: path.join(repositoryRoot, "web", "dist"),
};

export { env };
