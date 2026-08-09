// src/utils/llmClient.js
import { ApiError } from "./ApiError.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Reusable Groq API caller
 */
export const callClaude = async (systemPrompt, userPrompt, maxTokens = 1500) => {
    const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            max_tokens: maxTokens,
            temperature: 0.4,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new ApiError(502, `LLM API call fail hui: ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
};

/**
 * LLM response se clean JSON parse karta hai
 */
export const parseJSONFromLLM = (rawText) => {
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    try {
        return JSON.parse(cleaned);
    } catch (err) {
        throw new ApiError(500, "AI response ko JSON me parse nahi kar paya");
    }
};