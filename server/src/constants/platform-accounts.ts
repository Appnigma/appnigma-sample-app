import type { AccountDetailSource } from "../types/integration.types.js";

// Which account is connected is not in the shared shapes, so it is read from
// each platform's own API with request(). Add a platform here to show its
// account on the integration page.
const ACCOUNT_DETAIL_SOURCES: Record<string, AccountDetailSource> = {
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

export { ACCOUNT_DETAIL_SOURCES };
