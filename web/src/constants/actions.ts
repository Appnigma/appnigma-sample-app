import type { Choice } from "../types/ui.types";

// Up to this many choices sit side by side; more open from a picker.
const SIDE_BY_SIDE_CHOICES = 4;

// An optional field can be left unset, so the action uses its own default.
const NOT_SET_CHOICE: Choice = { value: "", chip: "Not set" };

const BOOLEAN_CHOICES: Choice[] = [
  { value: "true", chip: "Yes" },
  { value: "false", chip: "No" },
];

export { BOOLEAN_CHOICES, NOT_SET_CHOICE, SIDE_BY_SIDE_CHOICES };
