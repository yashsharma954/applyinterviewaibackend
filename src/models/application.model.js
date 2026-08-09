import mongoose, { Schema } from "mongoose";

const applicationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    job: {
        type: Schema.Types.ObjectId,
        ref: "Job",
        required: true
    },
    resume: {
        type: Schema.Types.ObjectId,
        ref: "Resume",
        required: true
    },
    matchScore: {
        type: Number,
        min: 0,
        max: 100
    },
    status: {
        type: String,
        enum: ["matched", "materials_ready", "applied"],
        default: "matched"
    },
    generatedMaterials: {
        resumePoints: [{ type: String }],
        coverLetter: { type: String },
        whyCompany: { type: String },
        linkedinMessage: { type: String }
    },
    appliedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Ek user ek job ke liye sirf ek hi Application rakh sakta hai
applicationSchema.index({ user: 1, job: 1 }, { unique: true });

export const Application = mongoose.model("Application", applicationSchema);