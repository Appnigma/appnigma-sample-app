import { SdkNotFoundError } from "@appnigma/sdk";
import { appnigma } from "../lib/appnigma.js";
import type { Integration, IntegrationStatus } from "../types/integration.types.js";

// A customer who never connected a platform has no status: the SDK answers
// SdkNotFoundError, which here simply means "not connected yet".
const statusOf = async (endCustomerId: string, platform: string): Promise<IntegrationStatus> => {
  try {
    const connection = await appnigma.connections.get({ endCustomerId, platform });
    return connection.status;
  } catch (error) {
    if (error instanceof SdkNotFoundError) return "not_connected";
    throw error;
  }
};

// The integrations page: every platform switched on for your company, and
// whether this customer has connected it. A platform Appnigma adds for you
// shows up here with no change to this code.
const listIntegrations = async (endCustomerId: string): Promise<Integration[]> => {
  const { platforms } = await appnigma.platforms.list();
  return Promise.all(
    platforms.map(async (platform) => ({
      platform: platform.platform,
      label: platform.label,
      support: platform.support,
      hasCrmData: (platform.coverage ?? []).length > 0,
      status: await statusOf(endCustomerId, platform.platform),
    })),
  );
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

const disconnectIntegration = async (endCustomerId: string, platform: string): Promise<void> => {
  await appnigma.connections.disconnect({ endCustomerId, platform });
};

export { disconnectIntegration, isPlatformOn, listIntegrations, startConnecting };
