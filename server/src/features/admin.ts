import { Router } from "express";
import { z } from "zod";
import { appnigma } from "../appnigma.js";
import { route } from "../errors.js";
import { jsonObjectSchema, platformSchema } from "../inputs.js";
import { requireSignedIn } from "../session.js";
import type { FunctionList, WorkspacePage } from "../types.js";

// Admin: every workspace and what it connected, removing one that left, and
// your team's own functions and developer guide. In your product these sit
// behind your staff login; this sample only asks for a signed-in workspace.

const WORKSPACES_PAGE_SIZE = 50;

// The same rule the SDK checks an end customer id by: any text, 1 to 255 characters.
const endCustomerIdSchema = z
  .string()
  .min(1)
  .refine((value) => [...value].length <= 255 && !/[\p{Cc}\p{Cs}]/u.test(value) && value.trim() !== "", "is not a workspace id");

const functionRunSchema = z.object({
  endCustomerId: endCustomerIdSchema,
  platform: platformSchema,
  functionName: z.string().trim().min(1).max(100),
  input: jsonObjectSchema,
});

const adminRouter = Router();

adminRouter.use(requireSignedIn);

// Every workspace that has connected something, with each connection's status.
// The id is the text this app uses for the workspace: any text up to 255
// characters, spaces and accents included.
adminRouter.get(
  "/workspaces",
  route(async (request, response) => {
    const { cursor } = z.object({ cursor: z.string().max(500).optional() }).parse(request.query);
    const page = await appnigma.connections.list({ limit: WORKSPACES_PAGE_SIZE, cursor });
    const workspaces: WorkspacePage = { workspaces: page.endCustomers, next: page.next };
    response.json(workspaces);
  }),
);

// A workspace that left the product: every connection, link, setting, draft
// and switch of theirs goes. Safe to send again.
adminRouter.post(
  "/workspaces/remove",
  route(async (request, response) => {
    const { endCustomerId } = z.object({ endCustomerId: endCustomerIdSchema }).parse(request.body);
    response.json(await appnigma.endCustomers.delete({ endCustomerId }));
  }),
);

// A self-serve page for one workspace, where its people manage their own
// rules on their own. Each link works once, for a short while.
adminRouter.post(
  "/workspaces/self-serve-link",
  route(async (request, response) => {
    const { endCustomerId } = z.object({ endCustomerId: endCustomerIdSchema }).parse(request.body);
    const link = await appnigma.portal.createLink({ endCustomerId });
    response.json({ url: link.url });
  }),
);

// Your team's own functions, with the shapes of their input and output.
adminRouter.get(
  "/functions",
  route(async (_request, response) => {
    const { functions } = await appnigma.catalog();
    const list: FunctionList = { functions };
    response.json(list);
  }),
);

// Runs one of them for a workspace: that workspace's own version when it has one.
adminRouter.post(
  "/functions/run",
  route(async (request, response) => {
    const run = functionRunSchema.parse(request.body);
    response.json(await appnigma.run({ endCustomerId: run.endCustomerId, platform: run.platform, functionName: run.functionName, input: run.input }));
  }),
);

// The guide for your developers, as markdown, written for your company from
// what is live right now.
adminRouter.get(
  "/guide",
  route(async (_request, response) => {
    response.json({ guide: (await appnigma.guide()).guide });
  }),
);

export { adminRouter };
