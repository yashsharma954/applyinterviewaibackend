import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app=express();

app.use(cors({
    origin: process.env.CORS_ORIGIN|| "*",
    credentials: true,
    methods: ["GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "authorization"]
}))

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

import UserRegister from "./routes/user.routes.js";
import resume from "./routes/resume.routes.js";
import application from "./routes/application.routes.js";
import job from "./routes/job.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import preference from "./routes/preference.routes.js";

app.use("/api/v1/user",UserRegister);
app.use("/api/v1/resume",resume);
app.use("/api/v1/application",application);
app.use("/api/v1/job",job);
app.use("/api/v1/preference", preference);
app.use(errorHandler);

export {app};