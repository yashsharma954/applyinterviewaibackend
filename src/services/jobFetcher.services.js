// src/services/jobFetcher.service.js
import axios from "axios";
import { Job } from "../models/job.model.js";
import { callClaude, parseJSONFromLLM } from "../utilis/llmClient.js";

const extractSkillsFromDescription = async (description) => {
    const systemPrompt = `You extract technical skills from job descriptions. Return ONLY valid JSON, no markdown.`;
    const userPrompt = `Extract a list of technical skills mentioned in this job description. Return JSON like: {"skills": ["react", "node.js"]}

Description: """${description.substring(0, 1500)}"""`;

    try {
        const raw = await callClaude(systemPrompt, userPrompt, 300);
        const parsed = parseJSONFromLLM(raw);
        return parsed.skills || [];
    } catch (err) {
        return [];
    }
};

export const fetchJobsFromArbeitnow = async () => {
    const url = "https://www.arbeitnow.com/api/job-board-api";
    const { data } = await axios.get(url);

    if (!data.data || data.data.length === 0) {
        return { savedCount: 0, message: "Koi jobs nahi mili" };
    }

    let savedCount = 0;
    const jobsToProcess = data.data.slice(0, 25);

    for (const job of jobsToProcess) {
        const description = job.description || "";

        // Pehle tags check karo, agar empty hain tabhi LLM call karo
        let skills = job.tags && job.tags.length ? job.tags : [];
        if (skills.length === 0) {
            skills = await extractSkillsFromDescription(description);
        }

        const jobData = {
            title: job.title,
            companyName: job.company_name || "Unknown Company",
            description,
            location: job.location || "Remote",
            isRemote: job.remote || false,
            stipend: 0,
            skillsRequired: skills,
            source: "arbeitnow",
            originalPostingUrl: job.url,
            postedDate: job.created_at ? new Date(job.created_at * 1000) : new Date()
        };

        await Job.findOneAndUpdate(
            { title: jobData.title, companyName: jobData.companyName },
            jobData,
            { upsert: true, new: true }
        );

        savedCount++;
    }

    return { savedCount, message: `${savedCount} jobs fetch/update ho gaye` };
};