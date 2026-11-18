// What an automation can run around, as the logic screen offers it.
const AUTOMATION_OPERATIONS = ["read", "write"] as const;

const AUTOMATION_TIMINGS = ["before", "after"] as const;

// The server takes up to 64 characters; a shorter limit keeps names readable.
const AUTOMATION_NAME_MAX_LENGTH = 60;

const AUTOMATION_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const AUTOMATION_REQUEST_MAX_LENGTH = 4000;

const AUTOMATION_CODE_MAX_LENGTH = 50_000;

const AUTOMATION_RUNS_PAGE_SIZE = 20;

export {
  AUTOMATION_CODE_MAX_LENGTH,
  AUTOMATION_NAME_MAX_LENGTH,
  AUTOMATION_NAME_PATTERN,
  AUTOMATION_OPERATIONS,
  AUTOMATION_REQUEST_MAX_LENGTH,
  AUTOMATION_RUNS_PAGE_SIZE,
  AUTOMATION_TIMINGS,
};
