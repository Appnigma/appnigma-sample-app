import { Router } from "express";
import { listCallsController, transcriptController } from "../controllers/calls.controller.js";
import {
  addCompanyController,
  addContactController,
  addDealController,
  customerOverviewController,
  customerRecordController,
  updateCustomerRecordController,
} from "../controllers/customers.controller.js";
import { requireSignedIn } from "../middleware/request-context.js";

const customersRouter = Router();

customersRouter.use(requireSignedIn);
customersRouter.get("/", customerOverviewController);
customersRouter.post("/contacts", addContactController);
customersRouter.post("/companies", addCompanyController);
customersRouter.post("/deals", addDealController);
customersRouter.get("/:kind/:id", customerRecordController);
customersRouter.patch("/:kind/:id", updateCustomerRecordController);

const callsRouter = Router();

callsRouter.use(requireSignedIn);
callsRouter.get("/", listCallsController);
callsRouter.get("/:callId/transcript", transcriptController);

export { callsRouter, customersRouter };
