import type { ActionEntry, JsonObject, JsonValue } from "@appnigma/sdk";
import { Router } from "express";
import type { Request } from "express";
import { z } from "zod";
import { appnigma } from "../appnigma.js";
import { route } from "../errors.js";
import { jsonObjectSchema, platformSchema } from "../inputs.js";
import { requireSignedIn, signedInWorkspace } from "../session.js";
import type { ActionField, ActionFieldType, ActionResult, IntegrationAction } from "../types.js";

// An integration's Actions tab: the ready-made actions its platform has, such
// as HubSpot's fetch-pipelines, a form for each drawn from the JSON Schema of
// its input, and running the one picked for the signed-in workspace. An action
// added to a platform shows up here with no change to this code.

// The rule action names follow, such as list-calls.
const actionNameSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/, "is not an action name");

const runSchema = z.object({ input: jsonObjectSchema });

// An input the form can be drawn from: one object of named fields.
const objectInputSchema = z.object({
  type: z.literal("object"),
  properties: z.record(z.string(), z.json()).default({}),
  required: z.array(z.string()).default([]),
});

// What one field's JSON Schema says that picks its box. A schema this
// doesn't read gets a box for JSON.
const propertySchema = z
  .object({
    type: z.union([z.string(), z.array(z.string())]).optional(),
    description: z.string().optional(),
    enum: z.array(z.json()).optional(),
    anyOf: z.array(z.object({ const: z.json().optional() })).optional(),
    items: z.object({ type: z.string().optional() }).optional(),
  })
  .catch({});

const BOX_BY_SCHEMA_TYPE: Partial<Record<string, ActionFieldType>> = {
  string: "text",
  number: "number",
  integer: "integer",
  boolean: "boolean",
};

const isText = (value: JsonValue | undefined): value is string => typeof value === "string";

// The values a field can take when its schema lists them: an enum, or the
// constants of a union, as Zod writes a union of literals.
const choicesOf = (property: z.infer<typeof propertySchema>): string[] => {
  const listed = property.enum ?? property.anyOf?.map((option) => option.const) ?? [];
  return listed.length > 0 && listed.every(isText) ? listed : [];
};

// The field's one type, leaving out "null" for a field that may also be empty.
const typeOf = (property: z.infer<typeof propertySchema>): string | null => {
  const types = (Array.isArray(property.type) ? property.type : [property.type]).filter((type) => type !== undefined && type !== "null");
  return types.length === 1 ? (types[0] ?? null) : null;
};

const boxOf = (property: z.infer<typeof propertySchema>): ActionFieldType => {
  if (choicesOf(property).length > 0) return "choice";
  const type = typeOf(property);
  if (type === "array" && property.items?.type === "string") return "list";
  return BOX_BY_SCHEMA_TYPE[type ?? ""] ?? "json";
};

const fieldOf = (name: string, schema: JsonValue, required: string[]): ActionField => {
  const property = propertySchema.parse(schema);
  return { name, type: boxOf(property), required: required.includes(name), description: property.description ?? null, choices: choicesOf(property) };
};

// A box for each field of the input, or null when it is not one object of
// fields and is typed in as JSON instead.
const fieldsOf = (input: JsonObject): ActionField[] | null => {
  const read = objectInputSchema.safeParse(input);
  if (!read.success) return null;
  const { properties, required } = read.data;
  return Object.entries(properties).map(([name, schema]) => fieldOf(name, schema, required));
};

const actionOf = (action: ActionEntry): IntegrationAction => ({ name: action.name, description: action.description, fields: fieldsOf(action.input) });

const platformOf = (request: Request): string => platformSchema.parse(request.params.platform);

// Mounted at /api/integrations/:platform/actions.
const actionsRouter = Router({ mergeParams: true });

actionsRouter.use(requireSignedIn);

// Every action the platform has. actions.list gives each one's name and
// description, and the JSON Schema of its input and output.
actionsRouter.get(
  "/",
  route(async (request, response) => {
    const platform = platformOf(request);
    const { actions } = await appnigma.actions.list({ platform });
    const listed: IntegrationAction[] = actions.filter((action) => action.platform === platform).map(actionOf);
    response.json({ actions: listed });
  }),
);

// Runs one on the account the signed-in workspace connected. The input is
// checked against the action's own schema before it runs, so a wrong or
// missing field is an SdkInputError naming it. A run is made once and never
// retried: only you know whether running it again is harmless.
actionsRouter.post(
  "/:action/run",
  route(async (request, response) => {
    const platform = platformOf(request);
    const action = actionNameSchema.parse(request.params.action);
    const { input } = runSchema.parse(request.body);
    const { output } = await appnigma.actions.run({ endCustomerId: signedInWorkspace(), platform, action, input });
    const result: ActionResult = { output };
    response.json(result);
  }),
);

export { actionsRouter };
