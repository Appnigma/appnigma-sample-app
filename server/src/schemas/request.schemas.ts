import { CLIENT_EVENT_TYPES, SDK_OBJECTS } from "@appnigma/sdk";
import { z } from "zod";
import {
  AUTOMATION_CODE_MAX_LENGTH,
  AUTOMATION_NAME_MAX_LENGTH,
  AUTOMATION_NAME_PATTERN,
  AUTOMATION_OPERATIONS,
  AUTOMATION_REQUEST_MAX_LENGTH,
  AUTOMATION_TIMINGS,
} from "../constants/automations.js";

const platformParamSchema = z.string().regex(/^[a-z0-9-]{2,40}$/, "is not a platform key");

const callIdParamSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "is not a call id");

// The same rule the SDK checks an end customer id by: any text, 1 to 255 characters.
const endCustomerIdSchema = z
  .string()
  .min(1)
  .refine((value) => [...value].length <= 255 && !/[\p{Cc}\p{Cs}]/u.test(value) && value.trim() !== "", "is not a workspace id");

const signInSchema = z.object({ account: z.string().trim().min(1).max(255) });

const jsonObjectSchema = z.record(z.string(), z.json());

// What someone typed into a platform's connect form, by each field's name.
const connectFieldsSchema = z.object({
  fields: z.record(z.string().regex(/^[A-Za-z0-9_]{1,64}$/, "is not a field name"), z.string().max(4000)),
});

const recordKindSchema = z.enum(["contacts", "companies", "deals"]);

const recordIdParamSchema = z.string().trim().min(1).max(200);

const platformQuerySchema = z.object({ platform: platformParamSchema });

const newContactSchema = z.object({
  platform: platformParamSchema,
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email(),
});

const newCompanySchema = z.object({
  platform: platformParamSchema,
  name: z.string().trim().min(1).max(120),
  domain: z.string().trim().min(3).max(120),
});

const closeDateSchema = z.iso.date();

const newDealSchema = z.object({
  platform: platformParamSchema,
  name: z.string().trim().min(1).max(120),
  amount: z.number().nonnegative().max(1_000_000_000).optional(),
  closeDate: closeDateSchema.optional(),
  companyId: z.string().trim().min(1).max(200).optional(),
});

const recordEditSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("contacts"),
    platform: platformParamSchema,
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.email(),
    phone: z.string().trim().max(40).optional(),
  }),
  z.object({
    kind: z.literal("companies"),
    platform: platformParamSchema,
    name: z.string().trim().min(1).max(120),
    domain: z.string().trim().max(120).optional(),
  }),
  z.object({
    kind: z.literal("deals"),
    platform: platformParamSchema,
    name: z.string().trim().min(1).max(120),
    amount: z.number().nonnegative().max(1_000_000_000).nullable(),
    closeDate: closeDateSchema.nullable(),
  }),
]);

const automationNameSchema = z
  .string()
  .trim()
  .max(AUTOMATION_NAME_MAX_LENGTH)
  .regex(AUTOMATION_NAME_PATTERN, "should be lower case words with dashes between them, such as round-deal-amounts");

const automationRefSchema = z.object({ platform: platformParamSchema, name: automationNameSchema });

const automationRequestSchema = z.string().trim().min(1, "should say what it should do").max(AUTOMATION_REQUEST_MAX_LENGTH);

const newAutomationSchema = z.object({
  platform: platformParamSchema,
  name: automationNameSchema,
  object: z.enum(SDK_OBJECTS),
  operation: z.enum(AUTOMATION_OPERATIONS),
  timing: z.enum(AUTOMATION_TIMINGS),
  request: automationRequestSchema,
});

const automationEditSchema = z.object({ request: automationRequestSchema, revision: z.number().int().min(0).optional() });

const automationCodeSchema = z.object({
  code: z.string().max(AUTOMATION_CODE_MAX_LENGTH),
  revision: z.number().int().min(0),
  liveCodeSha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
});

const automationTrialSchema = z.object({ input: jsonObjectSchema });

const automationRevisionSchema = z.object({ revision: z.number().int().min(1) });

const logicIdParamSchema = z.string().trim().min(1).max(100);

const automationSwitchSchema = z.object({ on: z.boolean() });

const newWebhookSchema = z.object({ url: z.url().refine((value) => value.startsWith("https://"), "should be an https address") });

const webhookIdParamSchema = z.string().trim().min(1).max(100);

const alertsSchema = z.object({ events: z.array(z.enum(CLIENT_EVENT_TYPES)) });

const syncSchema = z.object({ on: z.boolean() });

const eventLogQuerySchema = z.object({
  type: z.enum(CLIENT_EVENT_TYPES).optional(),
  cursor: z.string().max(500).optional(),
});

const workspacesQuerySchema = z.object({ cursor: z.string().max(500).optional() });

const workspaceRemovalSchema = z.object({ endCustomerId: endCustomerIdSchema });

const functionRunSchema = z.object({
  endCustomerId: endCustomerIdSchema,
  platform: platformParamSchema,
  functionName: z.string().trim().min(1).max(100),
  input: jsonObjectSchema,
});

export {
  alertsSchema,
  automationCodeSchema,
  automationEditSchema,
  automationRefSchema,
  automationRevisionSchema,
  automationSwitchSchema,
  automationTrialSchema,
  callIdParamSchema,
  connectFieldsSchema,
  eventLogQuerySchema,
  functionRunSchema,
  logicIdParamSchema,
  newAutomationSchema,
  newCompanySchema,
  newContactSchema,
  newDealSchema,
  newWebhookSchema,
  platformParamSchema,
  platformQuerySchema,
  recordEditSchema,
  recordIdParamSchema,
  recordKindSchema,
  signInSchema,
  syncSchema,
  webhookIdParamSchema,
  workspaceRemovalSchema,
  workspacesQuerySchema,
};
