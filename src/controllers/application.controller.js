// src/controllers/application.controller.js
import { asyncHandler } from "../utilis/asyncHandler.js";
import { ApiError } from "../utilis/ApiError.js";
import { ApiResponse } from "../utilis/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Resume } from "../models/resume.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { callClaude, parseJSONFromLLM } from "../utilis/llmClient.js";

// ── Agent Step 3: Application Materials Generate Karo ──
const generateApplicationMaterials = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { jobId } = req.params;

    if (!jobId) throw new ApiError(400, "jobId required hai");

    const user = await User.findById(userId);
    if (!user?.activeResume) throw new ApiError(400, "Pehle resume upload karo");

    const [resume, job] = await Promise.all([
        Resume.findById(user.activeResume),
        Job.findById(jobId)
    ]);

    if (!resume) throw new ApiError(404, "Resume nahi mila");
    if (!job) throw new ApiError(404, "Job nahi mili");

    // ── Duplicate application check karo ──
    let application = await Application.findOne({ user: userId, job: jobId });
    if (application?.status !== "matched" && application?.generatedMaterials?.coverLetter) {
        // Already generated hai, dobara LLM call na karo
        return res.status(200).json(
            new ApiResponse(200, application, "Materials pehle se generate ho chuke hain")
        );
    }

    // ── LLM se saari materials ek saath generate karwao ──
    const systemPrompt = `You are an expert career coach helping candidates apply to internships. Return ONLY valid JSON, no markdown, no preamble.`;

    const userPrompt = `Candidate resume data:
Skills: ${JSON.stringify(resume.parsedData?.skills)}
Projects: ${JSON.stringify(resume.parsedData?.projects)}
Experience: ${JSON.stringify(resume.parsedData?.experience)}

Job details:
Title: ${job.title}
Company: ${job.companyName}
Description: ${job.description}
Skills Required: ${JSON.stringify(job.skillsRequired)}

Generate application materials and return JSON in this exact format:
{
  "resumePoints": ["bullet point 1", "bullet point 2", "bullet point 3", "bullet point 4"],
  "coverLetter": "150 word cover letter here",
  "whyCompany": "80 word answer here",
  "linkedinMessage": "short 40-50 word LinkedIn connection message here"
}`;

    const rawResponse = await callClaude(systemPrompt, userPrompt, 1500);
    const generatedMaterials = parseJSONFromLLM(rawResponse);

    if (!generatedMaterials.coverLetter) {
        throw new ApiError(500, "Materials generate karne mein fail ho gaya");
    }

    // ── Match score calculate karo (job.controller wali logic reuse) ──
    const resumeSkills = new Set(
        (resume.parsedData?.skills || []).map((s) => s.toLowerCase().trim())
    );
    const jobSkills = (job.skillsRequired || []).map((s) => s.toLowerCase().trim());
    const matched = jobSkills.filter((s) => resumeSkills.has(s));
    const matchScore = jobSkills.length
        ? Math.round((matched.length / jobSkills.length) * 100)
        : 0;

    // ── Application create ya update karo (upsert) ──
    application = await Application.findOneAndUpdate(
        { user: userId, job: jobId },
        {
            user: userId,
            job: jobId,
            resume: resume._id,
            matchScore,
            status: "materials_ready",
            generatedMaterials
        },
        { new: true, upsert: true, runValidators: true }
    );

    return res.status(201).json(
        new ApiResponse(201, application, "Application materials generate ho gaye")
    );
});

// ── User "Apply" karke wapas aake status update kare ──
const markAsApplied = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { applicationId } = req.params;

    const application = await Application.findOneAndUpdate(
        { _id: applicationId, user: userId },
        { status: "applied", appliedAt: new Date() },
        { new: true }
    );

    if (!application) throw new ApiError(404, "Application nahi mili");

    return res.status(200).json(
        new ApiResponse(200, application, "Application applied mark ho gayi")
    );
});

// ── User ki saari applications (status filter ke saath) ──
const getMyApplications = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { status } = req.query; // optional: "matched" | "materials_ready" | "applied"

    const filter = { user: userId };
    if (status) filter.status = status;

    const applications = await Application.find(filter)
        .populate("job", "title companyName location stipend originalPostingUrl")
        .sort({ updatedAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, applications, "Applications fetch ho gayi")
    );
});

// ── Single application detail (dashboard modal ke liye) ──
const getApplicationById = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { applicationId } = req.params;

    const application = await Application.findOne({ _id: applicationId, user: userId })
        .populate("job");

    if (!application) throw new ApiError(404, "Application nahi mili");

    return res.status(200).json(
        new ApiResponse(200, application, "Application detail fetch ho gayi")
    );
});

export {
    generateApplicationMaterials,
    markAsApplied,
    getMyApplications,
    getApplicationById
};