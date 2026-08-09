// src/controllers/preference.controller.js
import { asyncHandler } from "../utilis/asyncHandler.js";
import { ApiError } from "../utilis/ApiError.js";
import { ApiResponse } from "../utilis/ApiResponse.js";
import { Preference } from "../models/preference.model.js";

// ── Create ya Update (upsert) preference ──
const setPreference = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { roles, locations, remoteOnly, minStipend, jobType } = req.body;

    if (!roles || roles.length === 0) {
        throw new ApiError(400, "Kam se kam ek role dena zaroori hai");
    }

    const preference = await Preference.findOneAndUpdate(
        { user: userId },
        { roles, locations, remoteOnly, minStipend, jobType },
        { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json(
        new ApiResponse(200, preference, "Preference save ho gayi")
    );
});

const getPreference = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const preference = await Preference.findOne({ user: userId });

    if (!preference) throw new ApiError(404, "Preference set nahi ki gayi abhi tak");

    return res.status(200).json(
        new ApiResponse(200, preference, "Preference fetch ho gayi")
    );
});

export { setPreference, getPreference };