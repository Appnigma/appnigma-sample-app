import type { LogicRunOutcome } from "@appnigma/sdk";
import type { LogicStage } from "@server-types";
import type { PlainStatus } from "../types/ui.types";

// Where a rule is, in plain words.
const LOGIC_STAGES: Record<LogicStage, PlainStatus> = {
  writing: { label: "Writing it", tone: "waiting" },
  testing: { label: "Testing it", tone: "waiting" },
  ready: { label: "Ready to go live", tone: "good" },
  needs_change: { label: "Needs a change", tone: "bad" },
  not_built: { label: "Couldn't build this", tone: "bad" },
  going_live: { label: "Going live", tone: "waiting" },
  live: { label: "Live", tone: "good" },
  failed: { label: "Didn't go live", tone: "bad" },
};

// The steps a new rule goes through, and which stage reaches which step.
const LOGIC_STEPS = ["Writing it", "Testing on sample data", "Ready to go live", "Live"];

const STEP_OF_STAGE: Record<LogicStage, number> = {
  writing: 0,
  testing: 1,
  ready: 2,
  needs_change: 1,
  not_built: 0,
  going_live: 3,
  live: 4,
  failed: 2,
};

// Stages that move on their own, so the page reads the list again until they settle.
const MOVING_STAGES: LogicStage[] = ["writing", "testing", "going_live"];

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

const LOGIC_POLL_MS = 3000;

export { LOGIC_POLL_MS, LOGIC_STAGES, LOGIC_STEPS, MOVING_STAGES, OBJECT_CHOICES, OPERATION_CHOICES, RUN_OUTCOMES, STEP_OF_STAGE, TIMING_CHOICES };
