import type { PlatformInfo } from "../types/ui.types";

// What the integrations page says about each platform, and where its logo comes from.
const PLATFORM_INFO: Record<string, PlatformInfo> = {
  salesforce: { domain: "salesforce.com", color: "#00a1e0", category: "CRM", description: "Accounts, contacts and opportunities, kept in step." },
  hubspot: { domain: "hubspot.com", color: "#ff7a59", category: "CRM", description: "Companies, contacts and deals from your HubSpot portal." },
  pipedrive: { domain: "pipedrive.com", color: "#1a1a1a", category: "CRM", description: "Organizations, people and deals from Pipedrive." },
  attio: { domain: "attio.com", color: "#0f0f0f", category: "CRM", description: "Companies, people and deals from your Attio workspace." },
  "zoho-crm": { domain: "zoho.com", color: "#e42527", category: "CRM", description: "Accounts, contacts and deals from Zoho CRM." },
  netsuite: { domain: "netsuite.com", color: "#1f4e79", category: "Finance", description: "Customers, invoices and payment terms from NetSuite." },
  quickbooks: { domain: "quickbooks.intuit.com", color: "#2ca01c", category: "Finance", description: "Customers and invoices from QuickBooks." },
  stripe: { domain: "stripe.com", color: "#635bff", category: "Finance", description: "Customers, subscriptions and payments from Stripe." },
  zendesk: { domain: "zendesk.com", color: "#03363d", category: "Support", description: "Open tickets next to the customer they belong to." },
  intercom: { domain: "intercom.com", color: "#1f8ded", category: "Support", description: "Conversations and contacts from Intercom." },
  jira: { domain: "atlassian.com", color: "#0052cc", category: "Work", description: "Create and follow Jira issues from your work." },
  slack: { domain: "slack.com", color: "#4a154b", category: "Work", description: "Updates in the Slack channels your team lives in." },
  gong: { domain: "gong.io", color: "#8039df", category: "Calls", description: "Recorded calls and transcripts next to each customer." },
  docusign: { domain: "docusign.com", color: "#d4a20f", category: "Work", description: "Send agreements and track who signed." },
};

const CATEGORY_ORDER = ["CRM", "Calls", "Support", "Finance", "Work", "Other"];

const POPULAR_CATEGORY = "CRM";

const CALL_PLATFORM = "gong";

export { CALL_PLATFORM, CATEGORY_ORDER, PLATFORM_INFO, POPULAR_CATEGORY };
