// src/models/job.model.js
import mongoose, { Schema } from "mongoose";

const jobSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        trim: true
    },
    isRemote: {
        type: Boolean,
        default: false
    },
    stipend: {
        type: Number,
        default: 0
    },
    skillsRequired: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    source: {
        type: String,
        enum: ["mock", "arbeitnow", "manual"],
        default: "arbeitnow"
    },
    originalPostingUrl: {
        type: String,
        required: true
    },
    postedDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Duplicate check ke liye compound index
jobSchema.index({ title: 1, companyName: 1 }, { unique: true });

// Search/filter ke liye
jobSchema.index({ title: "text", description: "text" });

export const Job = mongoose.model("Job", jobSchema);