import mongoose, { Schema } from "mongoose";

const resumeSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    fileUrl: {
        type: String,
        required: true   // cloudinary url (original PDF)
    },
    rawText: {
        type: String   // extracted plain text from PDF
    },
    parsedData: {
        skills: [{ type: String, trim: true }],
        projects: [{
            title: { type: String, trim: true },
            description: { type: String, trim: true },
            techUsed: [{ type: String, trim: true }]
        }],
        experience: [{
            company: { type: String, trim: true },
            role: { type: String, trim: true },
            duration: { type: String, trim: true },
            description: { type: String, trim: true }
        }],
        education: [{
            institution: { type: String, trim: true },
            degree: { type: String, trim: true },
            year: { type: String, trim: true }
        }]
    }
}, {
    timestamps: true
});

// Index for faster lookup of a user's resumes
resumeSchema.index({ user: 1 });

export const Resume = mongoose.model("Resume", resumeSchema);