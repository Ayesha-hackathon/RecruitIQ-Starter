import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeResumeRouter from "./analyze-resume";
import skillGapRouter from "./skill-gap";
import interviewRouter from "./interview";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeResumeRouter);
router.use(skillGapRouter);
router.use(interviewRouter);

export default router;
