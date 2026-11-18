import { Router } from "express";
import {
  accountController,
  actionsController,
  changesController,
  connectController,
  connectWithDetailsController,
  disconnectController,
  integrationController,
  listIntegrationsController,
} from "../controllers/integrations.controller.js";
import { requireSignedIn } from "../middleware/request-context.js";

const integrationsRouter = Router();

integrationsRouter.use(requireSignedIn);
integrationsRouter.get("/", listIntegrationsController);
integrationsRouter.get("/:platform", integrationController);
integrationsRouter.get("/:platform/account", accountController);
integrationsRouter.get("/:platform/actions", actionsController);
integrationsRouter.get("/:platform/changes", changesController);
integrationsRouter.post("/:platform/connect", connectController);
integrationsRouter.post("/:platform/connect-with-details", connectWithDetailsController);
integrationsRouter.post("/:platform/disconnect", disconnectController);

export { integrationsRouter };
