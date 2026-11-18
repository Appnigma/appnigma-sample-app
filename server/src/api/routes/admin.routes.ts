import { Router } from "express";
import { developerGuideController, listFunctionsController, runFunctionController } from "../controllers/developer.controller.js";
import {
  addWebhookController,
  chooseAlertsController,
  eventLogController,
  notificationSettingsController,
  removeWebhookController,
  switchSyncController,
} from "../controllers/notifications.controller.js";
import { listWorkspacesController, removeWorkspaceController } from "../controllers/workspaces.controller.js";
import { requireSignedIn } from "../middleware/request-context.js";

// Your team's own settings, across every workspace. In your product these sit
// behind your staff login; this sample only asks for a signed-in workspace.
const adminRouter = Router();

adminRouter.use(requireSignedIn);
adminRouter.get("/workspaces", listWorkspacesController);
adminRouter.post("/workspaces/remove", removeWorkspaceController);
adminRouter.get("/notifications", notificationSettingsController);
adminRouter.post("/webhooks", addWebhookController);
adminRouter.delete("/webhooks/:webhookId", removeWebhookController);
adminRouter.put("/alerts", chooseAlertsController);
adminRouter.put("/sync", switchSyncController);
adminRouter.get("/events", eventLogController);
adminRouter.get("/functions", listFunctionsController);
adminRouter.post("/functions/run", runFunctionController);
adminRouter.get("/guide", developerGuideController);

export { adminRouter };
