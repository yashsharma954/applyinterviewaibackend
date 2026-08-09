// src/controllers/job.controller.js
import { asyncHandler } from "../utilis/asyncHandler.js";
import { ApiError } from "../utilis/ApiError.js";
import { ApiResponse } from "../utilis/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Resume } from "../models/resume.model.js";
import { Preference } from "../models/preference.model.js";
import { Job } from "../models/job.model.js";
import { fetchJobsFromArbeitnow } from "../services/jobFetcher.services.js";

const calculateMatchScore = (resumeSkills = [], jobSkills = []) => {
    const normalize = (arr) => arr.map((s) => s.toLowerCase().trim());
    const rSkills = new Set(normalize(resumeSkills));
    const jSkills = normalize(jobSkills);

    if (jSkills.length === 0) return 0;

    const matched = jSkills.filter((s) => rSkills.has(s));
    return Math.round((matched.length / jSkills.length) * 100);
};

// ── Manual/Preference-triggered refresh ──
const refreshJobs = asyncHandler(async (req, res) => {
    const result = await fetchJobsFromArbeitnow();

    return res.status(200).json(
        new ApiResponse(200, result, "Jobs Arbeitnow se fetch ho gaye")
    );
});

// ── Matched Jobs fetch karo ──
const getMatchedJobs = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    const user = await User.findById(userId);
    if (!user?.activeResume) {
        throw new ApiError(400, "Pehle resume upload karo");
    }

    const resume = await Resume.findById(user.activeResume);
    const preference = await Preference.findOne({ user: userId });

    if (!preference) {
        throw new ApiError(400, "Pehle apni preferences set karo");
    }

    const filter = {};
    if (preference.remoteOnly) filter.isRemote = true;
    if (preference.locations?.length) filter.location = { $in: preference.locations };
    if (preference.roles?.length) {
        filter.title = { $regex: preference.roles.join("|"), $options: "i" };
    }

    let jobs = await Job.find(filter).limit(50);

    // Agar filter se koi job na mile, bina filter ke top jobs dikha do (fallback)
    if (jobs.length === 0) {
        jobs = await Job.find().limit(50);
    }

    // const scoredJobs = jobs
    //     .map((job) => ({
    //         ...job.toObject(),
    //         matchScore: calculateMatchScore(resume.parsedData?.skills, job.skillsRequired)
    //     }))
    //     .filter((job) => job.matchScore > 0)
    //     .sort((a, b) => b.matchScore - a.matchScore);

    // Naya:
     const scoredJobs = jobs
        .map((job) => ({
        ...job.toObject(),
        matchScore: calculateMatchScore(resume.parsedData?.skills, job.skillsRequired)
       }))
           .sort((a, b) => b.matchScore - a.matchScore);

        const hasAnyMatch = scoredJobs.some((job) => job.matchScore > 0);
        const finalJobs = hasAnyMatch
            ? scoredJobs.filter((job) => job.matchScore > 0)
       : scoredJobs.slice(0, 20); // koi match na ho to bhi top 20 dikha do

       return res.status(200).json(
       new ApiResponse(200, finalJobs, "Matched jobs fetch ho gaye")
       );

    
});

export { getMatchedJobs, refreshJobs };