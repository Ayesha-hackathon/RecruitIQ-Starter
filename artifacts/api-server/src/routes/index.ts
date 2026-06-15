import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import candidatesRouter from "./candidates";
import uploadResumeRouter from "./upload-resume";
import analyzeResumeRouter from "./analyze-resume";
import skillGapRouter from "./skill-gap";
import interviewRouter from "./interview";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(candidatesRouter);
router.use(uploadResumeRouter);
router.use(analyzeResumeRouter);
router.use(skillGapRouter);
router.use(interviewRouter);

export default router;
