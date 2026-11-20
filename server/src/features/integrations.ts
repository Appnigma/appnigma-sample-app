import { SdkNotFoundError } from "@appnigma/sdk";
import type { JsonValue, PlatformCoverage, PlatformEntry, SyncHealth } from "@appnigma/sdk";
import { Router } from "express";
import { z } from "zod";
import { appnigma } from "../appnigma.js";
import { env } from "../env.js";
import { route } from "../errors.js";
import { platformSchema } from "../inputs.js";
import { recentChanges } from "../jobs/record-sync.js";
import { requireSignedIn, signedInWorkspace } from "../session.js";
import type { AccountDetail, CrmData, Integration, IntegrationDetail, IntegrationStatus } from "../types.js";

// The Integrations page: every platform switched on for your company, whether
// this customer connected it, connecting and disconnecting, and what each
// connected account is.

const PLATFORM_OK_STATUS = 200;

// Which account is connected is not in the shared shapes, so it is read from
// each platform's own API with request(). Add a platform here to show its
// account on the integration page.
const ACCOUNT_DETAIL_SOURCES: Record<string, { path: string; fields: { label: string; field: string }[] }> = {
  hubspot: {
    path: "/account-info/v3/details",
    fields: [
      { label: "Account", field: "portalId" },
      { label: "Address", field: "uiDomain" },
      { label: "Time zone", field: "timeZone" },
    ],
  },
  pipedrive: {
    path: "/v1/users/me",
    fields: [
      { label: "Company", field: "data.company_name" },
      { label: "Address", field: "data.company_domain" },
      { label: "Connected by", field: "data.email" },
    ],
  },
  attio: {
    path: "/v2/self",
    fields: [
      { label: "Workspace", field: "workspace_name" },
      { label: "Address", field: "workspace_slug" },
    ],
  },
};

// What someone typed into a platform's connect form, by each field's name.
const connectFieldsSchema = z.object({
  fields: z.record(z.string().regex(/^[A-Za-z0-9_]{1,64}$/, "is not a field name"), z.string().max(4000)),
});

// A customer who never connected a platform has no connection: the SDK answers
// SdkNotFoundError, which here simply means "not connected yet".
const connectionOf = async (endCustomerId: string, platform: string): Promise<{ status: IntegrationStatus; sync: SyncHealth | null }> => {
  try {
    const connection = await appnigma.connections.get({ endCustomerId, platform });
    return { status: connection.status, sync: connection.sync };
  } catch (error) {
    if (error instanceof SdkNotFoundError) return { status: "not_connected", sync: null };
    throw error;
  }
};

// Coverage is null when it couldn't be read just now: that isn't "no CRM data".
const crmDataOf = (coverage: PlatformCoverage[] | null): CrmData => {
  if (coverage === null) return "unknown";
  return coverage.length > 0 ? "covered" : "none";
};

const integrationOf = (platform: PlatformEntry, status: IntegrationStatus): Integration => ({
  platform: platform.platform,
  label: platform.label,
  logoUrl: platform.logoUrl,
  support: platform.support,
  crmData: crmDataOf(platform.coverage),
  connectionType: platform.connectionType,
  status,
});

// Every platform switched on for your company, and whether this customer has
// connected it. A platform Appnigma adds for you shows up here with no change
// to this code.
const listIntegrations = async (endCustomerId: string): Promise<Integration[]> => {
  const { platforms } = await appnigma.platforms.list();
  return Promise.all(platforms.map(async (platform) => integrationOf(platform, (await connectionOf(endCustomerId, platform.platform)).status)));
};

// A customer's connected CRMs, the ones known to hold CRM records first.
const connectedCrmsOf = (integrations: Integration[]): Integration[] =>
  integrations
    .filter((integration) => integration.crmData !== "none" && integration.status === "connected")
    .sort((first, second) => Number(second.crmData === "covered") - Number(first.crmData === "covered"));

const isPlatformOn = async (platform: string): Promise<boolean> => {
  const { platforms } = await appnigma.platforms.list();
  return platforms.some((entry) => entry.platform === platform);
};

const isJsonRecord = (value: JsonValue | string | null): value is { [key: string]: JsonValue } => typeof value === "object" && value !== null && !Array.isArray(value);

// The text at a dotted path such as "data.company_name", or null.
const textAt = (body: JsonValue | string | null, path: string): string | null => {
  let current: JsonValue | string | null = body;
  for (const key of path.split(".")) {
    if (!isJsonRecord(current)) return null;
    current = current[key] ?? null;
  }
  if (typeof current === "string") return current.trim() === "" ? null : current;
  if (typeof current === "number" || typeof current === "boolean") return String(current);
  return null;
};

// The platform's page in this app, reached through RETURN_PAGE_URL when one is set.
const returnAddressFor = (platform: string): string => {
  const ownAddress = `${env.publicUrl}/integrations/${platform}`;
  if (!env.returnPageUrl) return ownAddress;
  const returnPage = new URL(env.returnPageUrl);
  returnPage.searchParams.set("to", ownAddress);
  return returnPage.toString();
};

const integrationsRouter = Router();

integrationsRouter.use(requireSignedIn);

integrationsRouter.get(
  "/",
  route(async (_request, response) => {
    response.json({ integrations: await listIntegrations(signedInWorkspace()) });
  }),
);

// One platform's page: what it covers, the boxes its connect form needs, and
// how its change checks are going.
integrationsRouter.get(
  "/:platform",
  route(async (request, response) => {
    const platform = platformSchema.parse(request.params.platform);
    const [entry, connection] = await Promise.all([appnigma.platforms.get({ platform }), connectionOf(signedInWorkspace(), platform)]);
    const integration: IntegrationDetail = { ...integrationOf(entry, connection.status), coverage: entry.coverage ?? [], fields: entry.fields ?? [], sync: connection.sync };
    response.json({ integration });
  }),
);

// Which account this customer connected, read from the platform's own API.
// request() hands back the platform's answer as it gave it, refusals
// included, so the status is checked here rather than caught.
integrationsRouter.get(
  "/:platform/account",
  route(async (request, response) => {
    const platform = platformSchema.parse(request.params.platform);
    const source = ACCOUNT_DETAIL_SOURCES[platform];
    let account: AccountDetail[] = [];
    if (source) {
      const answer = await appnigma.request({ endCustomerId: signedInWorkspace(), platform, method: "GET", path: source.path });
      if (answer.status === PLATFORM_OK_STATUS) {
        account = source.fields.flatMap(({ label, field }) => {
          const value = textAt(answer.body, field);
          return value === null ? [] : [{ label, value }];
        });
      }
    }
    response.json({ account });
  }),
);

integrationsRouter.get(
  "/:platform/changes",
  route(async (request, response) => {
    const platform = platformSchema.parse(request.params.platform);
    response.json(await recentChanges(signedInWorkspace(), platform));
  }),
);

// Connecting is a redirect: send the customer to the link, they approve on the
// platform, and they come back to returnUrl with ?status=connected.
integrationsRouter.post(
  "/:platform/connect",
  route(async (request, response) => {
    const platform = platformSchema.parse(request.params.platform);
    const link = await appnigma.connections.createLink({ endCustomerId: signedInWorkspace(), platform, returnUrl: returnAddressFor(platform) });
    response.json({ url: link.url });
  }),
);

// A platform whose connectionType is "fields" can be connected from your own
// form instead. The SDK encrypts what they typed before it leaves this server.
integrationsRouter.post(
  "/:platform/connect-with-details",
  route(async (request, response) => {
    const platform = platformSchema.parse(request.params.platform);
    const { fields } = connectFieldsSchema.parse(request.body);
    const connection = await appnigma.connections.connect({ endCustomerId: signedInWorkspace(), platform, fields });
    response.json({ status: connection.status });
  }),
);

integrationsRouter.post(
  "/:platform/disconnect",
  route(async (request, response) => {
    await appnigma.connections.disconnect({ endCustomerId: signedInWorkspace(), platform: platformSchema.parse(request.params.platform) });
    response.json({ disconnected: true });
  }),
);

export { connectedCrmsOf, integrationsRouter, isPlatformOn, listIntegrations };
