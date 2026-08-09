import mongoose, { Schema } from "mongoose";
  
  const preferenceSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  roles: [{ type: String }],              // e.g. "Full Stack", "Frontend"
  locations: [{ type: String }],
  remoteOnly: { type: Boolean, default: false },
  minStipend: { type: Number, default: 0 },
  jobType: { type: String, enum: ["internship", "full-time", "both"], default: "internship" }
}, { timestamps: true });

export const Preference = mongoose.model("Preference", preferenceSchema);