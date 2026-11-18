import type { IntegrationTab, MappingPreviewGroup } from "../types/ui.types";

// The tabs on a connected integration's page; custom logic and mapping only where the platform holds CRM data.
const INTEGRATION_TABS: { key: IntegrationTab; label: string; crmOnly: boolean }[] = [
  { key: "overview", label: "Overview", crmOnly: false },
  { key: "logic", label: "Custom logic", crmOnly: true },
  { key: "mapping", label: "Field mapping", crmOnly: true },
];

// What field mapping will look like: this app's fields on the left, the platform's on the right. A preview only.
const MAPPING_PREVIEW: MappingPreviewGroup[] = [
  { object: "Companies", pairs: [{ yours: "Account name", theirs: "Name" }, { yours: "Website", theirs: "Domain" }, { yours: "Account tier", theirs: "Customer tier" }] },
  { object: "Contacts", pairs: [{ yours: "Email", theirs: "Email" }, { yours: "Full name", theirs: "Name" }, { yours: "Phone", theirs: "Phone" }] },
  { object: "Deals", pairs: [{ yours: "Deal value", theirs: "Amount" }, { yours: "Stage", theirs: "Stage" }, { yours: "Renewal date", theirs: "Close date" }] },
];

export { INTEGRATION_TABS, MAPPING_PREVIEW };
