import { SdkNotFoundError } from "@appnigma/sdk";
import type { PlatformCoverage, PlatformEntry } from "@appnigma/sdk";
import { appnigma } from "../lib/appnigma.js";
import type { ConnectionState, CrmData, Integration, IntegrationAction, IntegrationDetail, IntegrationStatus } from "../types/integration.types.js";

// A customer who never connected a platform has no connection: the SDK answers
// SdkNotFoundError, which here simply means "not connected yet".
const connectionOf = async (endCustomerId: string, platform: string): Promise<ConnectionState> => {
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

// A customer's connected CRMs, the ones known to hold CRM records first.
const connectedCrmsOf = (integrations: Integration[]): Integration[] =>
  integrations
    .filter((integration) => integration.crmData !== "none" && integration.status === "connected")
    .sort((first, second) => Number(second.crmData === "covered") - Number(first.crmData === "covered"));

const integrationOf = (platform: PlatformEntry, status: IntegrationStatus): Integration => ({
  platform: platform.platform,
  label: platform.label,
  logoUrl: platform.logoUrl,
  support: platform.support,
  crmData: crmDataOf(platform.coverage),
  connectionType: platform.connectionType,
  status,
});

// The integrations page: every platform switched on for your company, and
// whether this customer has connected it. A platform Appnigma adds for you
// shows up here with no change to this code.
const listIntegrations = async (endCustomerId: string): Promise<Integration[]> => {
  const { platforms } = await appnigma.platforms.list();
  return Promise.all(platforms.map(async (platform) => integrationOf(platform, (await connectionOf(endCustomerId, platform.platform)).status)));
};

// One platform's page: what it covers, the boxes its connect form needs, and
// how its change checks are going.
const integrationDetail = async (endCustomerId: string, platform: string): Promise<IntegrationDetail> => {
  const [entry, connection] = await Promise.all([appnigma.platforms.get({ platform }), connectionOf(endCustomerId, platform)]);
  return { ...integrationOf(entry, connection.status), coverage: entry.coverage ?? [], fields: entry.fields ?? [], sync: connection.sync };
};

// The ready-made actions a platform has, such as Gong's get-call-transcript.
const platformActions = async (platform: string): Promise<IntegrationAction[]> => {
  const { actions } = await appnigma.actions.list({ platform });
  return actions.map((action) => ({ name: action.name, description: action.description }));
};

const isPlatformOn = async (platform: string): Promise<boolean> => {
  const { platforms } = await appnigma.platforms.list();
  return platforms.some((entry) => entry.platform === platform);
};

// Connecting is a redirect: send the customer to the link, they approve on the
// platform, and they come back to returnUrl with ?status=connected.
const startConnecting = async (endCustomerId: string, platform: string, returnUrl: string): Promise<string> => {
  const link = await appnigma.connections.createLink({ endCustomerId, platform, returnUrl });
  return link.url;
};

// A platform whose connectionType is "fields" can be connected from your own
// form instead. The SDK encrypts what they typed before it leaves this server.
const connectWithDetails = async (endCustomerId: string, platform: string, fields: Record<string, string>): Promise<IntegrationStatus> => {
  const connection = await appnigma.connections.connect({ endCustomerId, platform, fields });
  return connection.status;
};

const disconnectIntegration = async (endCustomerId: string, platform: string): Promise<void> => {
  await appnigma.connections.disconnect({ endCustomerId, platform });
};

export { connectedCrmsOf, connectWithDetails, disconnectIntegration, integrationDetail, isPlatformOn, listIntegrations, platformActions, startConnecting };
