import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeResumeRouter from "./analyze-resume";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeResumeRouter);

export default router;
