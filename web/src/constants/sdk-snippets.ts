import type { SdkSnippet } from "../types/ui.types";

const INTEGRATIONS = "server/src/services/integrations.service.ts";
const CUSTOMERS = "server/src/services/customers.service.ts";
const AUTOMATIONS = "server/src/services/automations.service.ts";
const NOTIFICATIONS = "server/src/services/notifications.service.ts";
const WORKSPACES = "server/src/services/workspaces.service.ts";
const DEVELOPER = "server/src/services/developer.service.ts";

// What each SDK call looks like in this repository's server code, for the "Under the hood" panel.
const SDK_SNIPPETS: Record<string, SdkSnippet> = {
  "features.list": {
    file: "server/src/services/app.service.ts",
    code: 'const { features } = await appnigma.features.list();\nconst syncOn = features.some((feature) => feature.name === "sync" && feature.enabled);',
  },
  "platforms.list": { file: INTEGRATIONS, code: "const { platforms } = await appnigma.platforms.list();\n// each has label, logoUrl, coverage, connectionType and fields" },
  "platforms.get": { file: INTEGRATIONS, code: "const platform = await appnigma.platforms.get({ platform });" },
  "connections.get": {
    file: INTEGRATIONS,
    code: "const connection = await appnigma.connections.get({ endCustomerId, platform });\n// connection.status, connection.sync\n// SdkNotFoundError means: not connected yet",
  },
  "connections.createLink": {
    file: INTEGRATIONS,
    code: "const link = await appnigma.connections.createLink({ endCustomerId, platform, returnUrl });\n// send the customer to link.url",
  },
  "connections.connect": {
    file: INTEGRATIONS,
    code: "const connection = await appnigma.connections.connect({ endCustomerId, platform, fields });\n// fields are encrypted before they leave your server",
  },
  "connections.disconnect": { file: INTEGRATIONS, code: "await appnigma.connections.disconnect({ endCustomerId, platform });" },
  "connections.list": { file: WORKSPACES, code: "const page = await appnigma.connections.list({ limit: 50, cursor });\n// page.endCustomers, page.next" },
  "endCustomers.delete": { file: WORKSPACES, code: "const removal = await appnigma.endCustomers.delete({ endCustomerId });" },
  "actions.list": { file: INTEGRATIONS, code: "const { actions } = await appnigma.actions.list({ platform });" },
  "actions.run": {
    file: "server/src/services/calls.service.ts",
    code: 'const { output } = await appnigma.actions.run({\n  endCustomerId,\n  platform: "gong",\n  action: "get-call-transcript",\n  input: { callId },\n});',
  },
  request: {
    file: "server/src/services/platform-account.service.ts",
    code: 'const answer = await appnigma.request({ endCustomerId, platform, method: "GET", path });\nif (answer.status === 200) read(answer.body);',
  },
  "sync.get": { file: "server/src/services/changes.service.ts", code: "const sync = await appnigma.sync.get();\n// sync.on, sync.platforms" },
  "sync.set": { file: NOTIFICATIONS, code: "const sync = await appnigma.sync.set({ on: true });" },
  "records.changes": {
    file: "server/src/services/changes.service.ts",
    code: 'const page = await appnigma.records.changes({ endCustomerId, platform, object: "deal", since });\nfor (const change of page.changes) apply(change.record);',
  },
  "logic.list": { file: AUTOMATIONS, code: "const { logic, folderProblems } = await appnigma.logic.list({ endCustomerId });" },
  "logic.get": { file: AUTOMATIONS, code: "const opened = await appnigma.logic.get({ endCustomerId, platform, name });\n// opened.file, opened.draft, opened.entry" },
  "logic.create": { file: AUTOMATIONS, code: 'await appnigma.logic.create({ endCustomerId, platform, name, trigger: { object: "deal", operation: "write", timing: "before" } });' },
  "logic.edit": { file: AUTOMATIONS, code: "const edited = await appnigma.logic.edit({ endCustomerId, platform, name, prompt, requestedBy });\n// edited.saved, edited.summary, edited.problems" },
  "logic.update": { file: AUTOMATIONS, code: "await appnigma.logic.update({ endCustomerId, platform, name, source, revision });" },
  "logic.check": { file: AUTOMATIONS, code: "const { problems } = await appnigma.logic.check({ endCustomerId, platform, name });" },
  "logic.test": { file: AUTOMATIONS, code: "const tried = await appnigma.logic.test({ endCustomerId, platform, name, input });\n// tried.output or tried.error, tried.calls" },
  "logic.goLive": { file: AUTOMATIONS, code: "await appnigma.logic.goLive({ endCustomerId, platform, name, revision });" },
  "logic.goLiveStatus": { file: AUTOMATIONS, code: "const status = await appnigma.logic.goLiveStatus({ endCustomerId, platform, name });\n// checking, live, failed or none" },
  "logic.discard": { file: AUTOMATIONS, code: "await appnigma.logic.discard({ endCustomerId, platform, name, revision });" },
  "logic.switchOn": { file: AUTOMATIONS, code: "await appnigma.logic.switchOn({ logicId, endCustomerId });" },
  "logic.switchOff": { file: AUTOMATIONS, code: "await appnigma.logic.switchOff({ logicId, endCustomerId });" },
  "logic.runs": { file: AUTOMATIONS, code: "const { runs } = await appnigma.logic.runs({ logicId, endCustomerId, limit: 20 });" },
  "portal.createLink": { file: AUTOMATIONS, code: "const link = await appnigma.portal.createLink({ endCustomerId });\n// open link.url" },
  "webhooks.create": { file: NOTIFICATIONS, code: "const { webhook, secret } = await appnigma.webhooks.create({ url });\n// the secret is shown once: keep it" },
  "webhooks.list": { file: NOTIFICATIONS, code: "const { webhooks } = await appnigma.webhooks.list();" },
  "webhooks.delete": { file: NOTIFICATIONS, code: "await appnigma.webhooks.delete({ webhookId });" },
  "alerts.get": { file: NOTIFICATIONS, code: "const { events } = await appnigma.alerts.get();" },
  "alerts.set": { file: NOTIFICATIONS, code: "await appnigma.alerts.set({ events });" },
  "events.list": { file: NOTIFICATIONS, code: "const page = await appnigma.events.list({ type, cursor, limit: 20 });" },
  catalog: { file: DEVELOPER, code: "const { functions } = await appnigma.catalog();" },
  run: { file: DEVELOPER, code: "const { output, ranAs } = await appnigma.run({ endCustomerId, platform, functionName, input });" },
  guide: { file: DEVELOPER, code: "const { guide } = await appnigma.guide();" },
};

const CRM_OBJECTS = ["contacts", "companies", "deals"] as const;

for (const object of CRM_OBJECTS) {
  SDK_SNIPPETS[`crm.${object}.list`] = { file: CUSTOMERS, code: `const page = await appnigma.crm.${object}.list({ endCustomerId, platform, limit: 50 });` };
  SDK_SNIPPETS[`crm.${object}.get`] = { file: CUSTOMERS, code: `const { record } = await appnigma.crm.${object}.get({ endCustomerId, platform, id });` };
  SDK_SNIPPETS[`crm.${object}.create`] = { file: CUSTOMERS, code: `const { record } = await appnigma.crm.${object}.create({ endCustomerId, platform, record });` };
  SDK_SNIPPETS[`crm.${object}.update`] = { file: CUSTOMERS, code: `const { record } = await appnigma.crm.${object}.update({ endCustomerId, platform, id, record });` };
}

export { SDK_SNIPPETS };
