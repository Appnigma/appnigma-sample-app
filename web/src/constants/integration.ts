import type { IntegrationTabEntry, MappingPreviewGroup } from "../types/ui.types";

// The tabs on a connected integration's page; actions only where the platform has some, custom logic and mapping only where it holds CRM data.
const INTEGRATION_TABS: IntegrationTabEntry[] = [
  { key: "overview", label: "Overview", needs: "nothing" },
  { key: "actions", label: "Actions", needs: "actions" },
  { key: "logic", label: "Custom logic", needs: "crm-data" },
  { key: "mapping", label: "Field mapping", needs: "crm-data" },
];

// What field mapping will look like: this app's fields on the left, the platform's on the right. A preview only.
const MAPPING_PREVIEW: MappingPreviewGroup[] = [
  { object: "Companies", pairs: [{ yours: "Account name", theirs: "Name" }, { yours: "Website", theirs: "Domain" }, { yours: "Account tier", theirs: "Customer tier" }] },
  { object: "Contacts", pairs: [{ yours: "Email", theirs: "Email" }, { yours: "Full name", theirs: "Name" }, { yours: "Phone", theirs: "Phone" }] },
  { object: "Deals", pairs: [{ yours: "Deal value", theirs: "Amount" }, { yours: "Stage", theirs: "Stage" }, { yours: "Renewal date", theirs: "Close date" }] },
];

export { INTEGRATION_TABS, MAPPING_PREVIEW };
