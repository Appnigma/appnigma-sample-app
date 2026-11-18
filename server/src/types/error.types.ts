// A failure as this app answers it: the status, the plain words its user
// sees, extra fields for the page (such as the SDK's code), and what only the
// server log should say.
type ErrorAnswer = {
  status: number;
  message: string;
  extra: Record<string, string | null>;
  log: string | null;
};

export type { ErrorAnswer };
