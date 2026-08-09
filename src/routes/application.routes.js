// src/routes/application.routes.js
import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    generateApplicationMaterials,
    markAsApplied,
    getMyApplications,
    getApplicationById
} from "../controllers/application.controller.js";

const router = Router();

router.route("/generate/:jobId").post(verifyJWT, generateApplicationMaterials);
router.route("/mark-applied/:applicationId").patch(verifyJWT, markAsApplied);
router.route("/my-applications").get(verifyJWT, getMyApplications);
router.route("/:applicationId").get(verifyJWT, getApplicationById);

export default router;