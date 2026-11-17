import { Router } from "express";
import { appInfoController, signInController, signOutController, underTheHoodController } from "../controllers/app.controller.js";
import { requireSignedIn } from "../middleware/request-context.js";

const appRouter = Router();

appRouter.get("/", appInfoController);
appRouter.post("/session", signInController);
appRouter.delete("/session", signOutController);

const underTheHoodRouter = Router();

underTheHoodRouter.use(requireSignedIn);
underTheHoodRouter.get("/", underTheHoodController);

export { appRouter, underTheHoodRouter };
