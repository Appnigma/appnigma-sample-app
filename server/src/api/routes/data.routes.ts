import { Router } from "express";
import { listCallsController, transcriptController } from "../controllers/calls.controller.js";
import { addContactController, customerOverviewController } from "../controllers/customers.controller.js";
import { requireSignedIn } from "../middleware/request-context.js";

const customersRouter = Router();

customersRouter.use(requireSignedIn);
customersRouter.get("/", customerOverviewController);
customersRouter.post("/contacts", addContactController);

const callsRouter = Router();

callsRouter.use(requireSignedIn);
callsRouter.get("/", listCallsController);
callsRouter.get("/:callId/transcript", transcriptController);

export { callsRouter, customersRouter };
