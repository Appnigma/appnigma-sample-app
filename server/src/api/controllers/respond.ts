import type { Response } from "express";
import { errorAnswerOf } from "../../lib/error-answer.js";

// Every controller's catch ends here: the user gets plain words, the server log gets the details.
const respondWithError = (response: Response, error: unknown): void => {
  const { status, message, extra, log } = errorAnswerOf(error);
  if (log) console.error(log);
  response.status(status).json({ error: { message, ...extra } });
};

export { respondWithError };
