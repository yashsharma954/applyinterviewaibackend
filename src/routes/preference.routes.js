// src/routes/preference.routes.js
import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { setPreference, getPreference } from "../controllers/preference.controller.js";

const router = Router();

router.route("/").post(verifyJWT, setPreference).get(verifyJWT, getPreference);

export default router;