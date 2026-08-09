// src/controllers/resume.controller.js
// src/controllers/resume.controller.js
import { asyncHandler } from "../utilis/asyncHandler.js";
import { ApiError } from "../utilis/ApiError.js";
import { ApiResponse } from "../utilis/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Resume } from "../models/resume.model.js";
import { callClaude, parseJSONFromLLM } from "../utilis/llmClient.js";
import { uploadOnCloudinary } from "../utilis/cloudinary.js";
import fs from "fs-extra";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
// ... baaki controller code same rahega
// ── Resume Upload + Parse (Agent Step 1) ──
const uploadResume = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const localFilePath = req.file?.path;
    if (!localFilePath) throw new ApiError(400, "Resume file required hai");

    // ── PDF se raw text extract karo ──
    const fileBuffer = await fs.readFile(localFilePath);
    const pdfData = await pdfParse(fileBuffer);
    const rawText = pdfData.text?.trim();

    if (!rawText || rawText.length < 50) {
        await fs.remove(localFilePath);
        throw new ApiError(400, "Resume me enough readable text nahi hai");
    }

    // ── Cloudinary pe upload karo ──
    const cloudinaryResponse = await uploadOnCloudinary(localFilePath);
    if (!cloudinaryResponse?.url) {
        throw new ApiError(500, "Resume upload fail hua");
    }

    // ── LLM se structured JSON nikalwao ──
    const systemPrompt = `You are a resume parsing assistant. Extract structured data from resumes and return ONLY valid JSON, no markdown, no preamble.`;

    const userPrompt = `Extract the following from this resume text and return JSON with exactly these keys:
{
  "skills": ["skill1", "skill2"],
  "projects": [{ "title": "", "description": "", "techUsed": [] }],
  "experience": [{ "company": "", "role": "", "duration": "", "description": "" }],
  "education": [{ "institution": "", "degree": "", "year": "" }]
}

Resume Text:
"""${rawText.substring(0, 6000)}"""`;

    const rawResponse = await callClaude(systemPrompt, userPrompt, 2000);
    const parsedData = parseJSONFromLLM(rawResponse);

    if (!parsedData.skills || parsedData.skills.length === 0) {
        throw new ApiError(500, "Resume se skills extract nahi ho payi");
    }

    // ── Resume DB me save karo ──
    const resume = await Resume.create({
        user: userId,
        fileUrl: cloudinaryResponse.url,
        rawText,
        parsedData
    });

    // ── User document update karo (naya resume active ban jaye) ──
    await User.findByIdAndUpdate(userId, {
        $push: { resumes: resume._id },
        activeResume: resume._id
    });

    await fs.remove(localFilePath); // temp file cleanup

    return res.status(201).json(
        new ApiResponse(201, resume, "Resume upload aur parse ho gaya")
    );
});

// ── User ke saare resumes list karo ──
// ── User ke saare resumes list karo (active flag ke saath) ──
const getMyResumes = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    const user = await User.findById(userId).select("activeResume");
    const resumes = await Resume.find({ user: userId }).sort({ createdAt: -1 });

    const resumesWithActiveFlag = resumes.map((resume) => ({
        ...resume.toObject(),
        _isActive: user?.activeResume?.toString() === resume._id.toString()
    }));

    return res.status(200).json(
        new ApiResponse(200, resumesWithActiveFlag, "Resumes fetch ho gaye")
    );
});

// ── Kisi resume ko active banao ──
const setActiveResume = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { resumeId } = req.params;

    const resume = await Resume.findOne({ _id: resumeId, user: userId });
    if (!resume) throw new ApiError(404, "Resume nahi mila");

    await User.findByIdAndUpdate(userId, { activeResume: resumeId });

    return res.status(200).json(
        new ApiResponse(200, resume, "Active resume update ho gaya")
    );
});

// ── Resume delete karo ──
const deleteResume = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { resumeId } = req.params;

    const resume = await Resume.findOneAndDelete({ _id: resumeId, user: userId });
    if (!resume) throw new ApiError(404, "Resume nahi mila");

    await User.findByIdAndUpdate(userId, { $pull: { resumes: resumeId } });

    return res.status(200).json(
        new ApiResponse(200, {}, "Resume delete ho gaya")
    );
});

export { uploadResume, getMyResumes, setActiveResume, deleteResume };