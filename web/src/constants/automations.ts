import type { LogicRunOutcome, LogicStatus } from "@appnigma/sdk";
import type { PlainStatus } from "../types/ui.types";

const AUTOMATION_STATUS: Record<LogicStatus, PlainStatus> = {
  live: { label: "Live", tone: "good" },
  checking: { label: "Going live", tone: "waiting" },
  draft: { label: "Not live yet", tone: "quiet" },
  failed: { label: "Did not go live", tone: "bad" },
};

const RUN_OUTCOMES: Record<LogicRunOutcome, string> = {
  changed: "Changed the data",
  unchanged: "Left it as it was",
  ran: "Ran",
  failed: "Failed",
};

const OBJECT_CHOICES = [
  { value: "contact", label: "a contact" },
  { value: "company", label: "a company" },
  { value: "deal", label: "a deal" },
] as const;

const OPERATION_CHOICES = [
  { value: "write", label: "is saved" },
  { value: "read", label: "is read" },
] as const;

const TIMING_CHOICES = [
  { value: "before", label: "Before" },
  { value: "after", label: "After" },
] as const;

const GO_LIVE_POLL_MS = 3000;

// What a trial is handed when the person does not change it.
const SAMPLE_TRIAL_INPUT = '{\n  "record": {\n    "firstName": "Ada",\n    "lastName": "Lovelace",\n    "emails": [{ "value": "ada@example.com", "type": "work", "primary": true }]\n  }\n}';

export { AUTOMATION_STATUS, GO_LIVE_POLL_MS, OBJECT_CHOICES, OPERATION_CHOICES, RUN_OUTCOMES, SAMPLE_TRIAL_INPUT, TIMING_CHOICES };
