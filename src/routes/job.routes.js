// src/routes/job.routes.js
import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { getMatchedJobs, refreshJobs } from "../controllers/job.controller.js";

const router = Router();

router.route("/refresh").post(verifyJWT, refreshJobs);
router.route("/matched").get(verifyJWT, getMatchedJobs);

export default router;