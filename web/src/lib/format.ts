const RECENT_WINDOW_MS = 10 * 60_000;

const money = (amount: number | null, currency: string | null = "USD"): string =>
  amount === null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: currency ?? "USD", maximumFractionDigits: 0 }).format(amount);

const compactMoney = (amount: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(amount);

const timeAgo = (iso: string): string => {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
};

const isRecent = (iso: string | null): boolean => iso !== null && Date.now() - new Date(iso).getTime() < RECENT_WINDOW_MS;

const greetingOf = (date: Date): string => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export { compactMoney, greetingOf, isRecent, money, timeAgo };
