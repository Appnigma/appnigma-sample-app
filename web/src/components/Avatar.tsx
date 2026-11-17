import { initialsOf } from "../lib/platforms";

const PALETTE = ["bg-sky-100 text-sky-700", "bg-violet-100 text-violet-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-800", "bg-rose-100 text-rose-700", "bg-indigo-100 text-indigo-700"];

const colorOf = (name: string): string => PALETTE[[...name].reduce((total, character) => total + character.charCodeAt(0), 0) % PALETTE.length] ?? PALETTE[0] ?? "";

const Avatar = ({ name, size = "medium" }: { name: string; size?: "small" | "medium" }) => (
  <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${size === "small" ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-xs"} ${colorOf(name)}`}>
    {initialsOf(name)}
  </span>
);

export { Avatar };
