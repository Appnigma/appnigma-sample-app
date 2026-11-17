import type { ConnectionStatus, PlatformSupport } from "@appnigma/sdk";

type IntegrationStatus = ConnectionStatus | "not_connected";

type Integration = {
  platform: string;
  label: string;
  support: PlatformSupport;
  hasCrmData: boolean;
  status: IntegrationStatus;
};

export type { Integration, IntegrationStatus };
