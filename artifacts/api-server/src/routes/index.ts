import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeResumeRouter from "./analyze-resume";
import skillGapRouter from "./skill-gap";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeResumeRouter);
router.use(skillGapRouter);

export default router;
