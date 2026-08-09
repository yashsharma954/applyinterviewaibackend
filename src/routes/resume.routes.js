// src/routes/resume.routes.js
import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {
    uploadResume,
    getMyResumes,
    setActiveResume,
    deleteResume
} from "../controllers/resume.controller.js";

const router = Router();

router.route("/upload").post(verifyJWT, upload.single("resume"), uploadResume);
router.route("/my-resumes").get(verifyJWT, getMyResumes);
router.route("/set-active/:resumeId").patch(verifyJWT, setActiveResume);
router.route("/:resumeId").delete(verifyJWT, deleteResume);

export default router;