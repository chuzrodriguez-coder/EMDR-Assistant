import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import sessionsRouter from "./sessions";
import emailRouter from "./email";
import themesRouter from "./themes";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/sessions", sessionsRouter);
router.use("/email", emailRouter);
router.use("/themes", themesRouter);

export default router;
