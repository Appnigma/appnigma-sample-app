import type { Integration } from "@server-types/integration.types";
import { PLATFORM_INFO } from "../constants/platforms";
import type { PlatformInfo } from "../types/ui.types";

const FALLBACK_INFO: PlatformInfo = { domain: "", color: "#475569", category: "Other", description: "Connect your account to bring its data in." };

const infoOf = (platform: string): PlatformInfo => PLATFORM_INFO[platform] ?? FALLBACK_INFO;

const logoUrlOf = (domain: string): string | null => (domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : null);

const initialsOf = (label: string): string =>
  label
    .split(/[\s&-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const hexToRgbChannels = (hex: string): string => {
  const value = Number.parseInt(hex.slice(1), 16);
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
};

// A customer's connected CRMs, the ones known to hold CRM records first. A
// platform whose coverage couldn't be read still counts: its CRM calls answer for themselves.
const connectedCrmsOf = (integrations: Integration[]): Integration[] =>
  integrations
    .filter((integration) => integration.crmData !== "none" && integration.status === "connected")
    .sort((first, second) => Number(second.crmData === "covered") - Number(first.crmData === "covered"));

export { connectedCrmsOf, hexToRgbChannels, infoOf, initialsOf, logoUrlOf };
