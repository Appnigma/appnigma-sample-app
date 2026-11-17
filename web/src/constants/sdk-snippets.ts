import type { SdkSnippet } from "../types/ui.types";

// What each SDK call looks like in this repository's server code, for the "Under the hood" panel.
const SDK_SNIPPETS: Record<string, SdkSnippet> = {
  "platforms.list": {
    file: "server/src/services/integrations.service.ts",
    code: "const { platforms } = await appnigma.platforms.list();",
  },
  "connections.get": {
    file: "server/src/services/integrations.service.ts",
    code: "const connection = await appnigma.connections.get({ endCustomerId, platform });\n// SdkNotFoundError means: not connected yet",
  },
  "connections.createLink": {
    file: "server/src/services/integrations.service.ts",
    code: "const link = await appnigma.connections.createLink({ endCustomerId, platform, returnUrl });\n// send the customer to link.url",
  },
  "connections.disconnect": {
    file: "server/src/services/integrations.service.ts",
    code: "await appnigma.connections.disconnect({ endCustomerId, platform });",
  },
  "crm.companies.list": {
    file: "server/src/services/customers.service.ts",
    code: "const page = await appnigma.crm.companies.list({ endCustomerId, platform, limit: 20 });",
  },
  "crm.contacts.list": {
    file: "server/src/services/customers.service.ts",
    code: "const page = await appnigma.crm.contacts.list({ endCustomerId, platform, limit: 20 });",
  },
  "crm.deals.list": {
    file: "server/src/services/customers.service.ts",
    code: "const page = await appnigma.crm.deals.list({ endCustomerId, platform, limit: 20 });",
  },
  "crm.contacts.create": {
    file: "server/src/services/customers.service.ts",
    code: 'const { record } = await appnigma.crm.contacts.create({\n  endCustomerId,\n  platform,\n  record: { firstName, lastName, emails: [{ value: email, type: "work", primary: true }] },\n});',
  },
  "actions.run": {
    file: "server/src/services/calls.service.ts",
    code: 'const { output } = await appnigma.actions.run({\n  endCustomerId,\n  platform: "gong",\n  action: "get-call-transcript",\n  input: { callId },\n});',
  },
};

export { SDK_SNIPPETS };
