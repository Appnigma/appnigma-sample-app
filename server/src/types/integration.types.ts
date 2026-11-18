import type { ConnectField, ConnectionStatus, PlatformConnectionType, PlatformCoverage, PlatformSupport, SyncHealth } from "@appnigma/sdk";

type IntegrationStatus = ConnectionStatus | "not_connected";

// Whether a platform holds CRM records: its coverage says so, says not, or
// couldn't be read just now. Unknown still counts: its CRM calls answer for themselves.
type CrmData = "covered" | "unknown" | "none";

type ConnectionState = {
  status: IntegrationStatus;
  sync: SyncHealth | null;
};

type Integration = {
  platform: string;
  label: string;
  logoUrl: string | null;
  support: PlatformSupport;
  crmData: CrmData;
  connectionType: PlatformConnectionType;
  status: IntegrationStatus;
};

type IntegrationAction = {
  name: string;
  description: string;
};

type IntegrationDetail = Integration & {
  coverage: PlatformCoverage[];
  fields: ConnectField[];
  sync: SyncHealth | null;
};

type AccountDetailSource = {
  path: string;
  fields: { label: string; field: string }[];
};

type AccountDetail = {
  label: string;
  value: string;
};

export type { AccountDetail, AccountDetailSource, ConnectionState, CrmData, Integration, IntegrationAction, IntegrationDetail, IntegrationStatus };
