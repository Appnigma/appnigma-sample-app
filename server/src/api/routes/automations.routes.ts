import { Router } from "express";
import {
  automationController,
  automationEditorLinkController,
  automationRunsController,
  changeAutomationController,
  checkAutomationController,
  createAutomationController,
  goLiveController,
  goLiveProgressController,
  listAutomationsController,
  saveAutomationCodeController,
  switchAutomationController,
  throwAwayDraftController,
  tryAutomationController,
} from "../controllers/automations.controller.js";
import { requireSignedIn } from "../middleware/request-context.js";

const automationsRouter = Router();

automationsRouter.use(requireSignedIn);
automationsRouter.get("/", listAutomationsController);
automationsRouter.post("/", createAutomationController);
automationsRouter.post("/editor-link", automationEditorLinkController);
automationsRouter.post("/by-id/:logicId/switch", switchAutomationController);
automationsRouter.get("/by-id/:logicId/runs", automationRunsController);
automationsRouter.get("/:platform/:name", automationController);
automationsRouter.post("/:platform/:name/change", changeAutomationController);
automationsRouter.put("/:platform/:name/code", saveAutomationCodeController);
automationsRouter.post("/:platform/:name/check", checkAutomationController);
automationsRouter.post("/:platform/:name/try", tryAutomationController);
automationsRouter.post("/:platform/:name/go-live", goLiveController);
automationsRouter.get("/:platform/:name/go-live", goLiveProgressController);
automationsRouter.post("/:platform/:name/discard", throwAwayDraftController);

export { automationsRouter };
