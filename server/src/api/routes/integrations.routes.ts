import { Router } from "express";
import { connectController, disconnectController, listIntegrationsController } from "../controllers/integrations.controller.js";
import { requireSignedIn } from "../middleware/request-context.js";

const integrationsRouter = Router();

integrationsRouter.use(requireSignedIn);
integrationsRouter.get("/", listIntegrationsController);
integrationsRouter.post("/:platform/connect", connectController);
integrationsRouter.post("/:platform/disconnect", disconnectController);

export { integrationsRouter };
