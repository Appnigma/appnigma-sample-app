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

export { hexToRgbChannels, infoOf, initialsOf, logoUrlOf };
