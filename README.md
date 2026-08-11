# ApplyAI — Backend

The backend API for **ApplyAI**, an agentic internship application platform. It parses resumes, matches candidates to live internship listings, and orchestrates a multi-step LLM pipeline to generate tailored application materials — while keeping every actual submission in the user's hands.

**Live API:** `https://applyinterviewaibackend.onrender.com`
**Frontend repo:** [applyinterviewai-frontend](https://github.com/yashsharma954/applyinterviewai-frontend)

---

## What it does

1. **Auth** — JWT-based register/login with access + refresh token rotation
2. **Resume parsing** — extracts text from an uploaded PDF and uses an LLM to structure it into skills, projects, experience, and education
3. **Preferences** — stores target roles, locations, remote-only, and minimum stipend per user
4. **Job ingestion** — pulls live internship/job listings from a public job board API, extracting skill tags via LLM where the source doesn't provide them
5. **Matching** — scores each job against the user's active resume using a skill-overlap algorithm
6. **Materials generation** — a single orchestrated LLM call produces tailored resume bullet points, a cover letter, a "why this company" answer, and a LinkedIn outreach message per job
7. **Application tracking** — status moves through `matched → materials_ready → applied`, set explicitly by the user

The agent never submits an application on its own — it prepares copy-ready materials and links out to the original posting.

---

## Tech stack

- **Node.js / Express**
- **MongoDB / Mongoose**
- **JWT** (access + refresh tokens, httpOnly cookies)
- **Groq API** for resume parsing, skill extraction, and application material generation
- **Cloudinary** for resume file storage
- **Arbeitnow API** for live job listings
- **Multer** for file uploads

---

## Project structure

```
src/
├── controllers/
│   ├── user.controller.js
│   ├── resume.controller.js
│   ├── preference.controller.js
│   ├── job.controller.js
│   └── application.controller.js
├── models/
│   ├── user.model.js
│   ├── resume.model.js
│   ├── preference.model.js
│   ├── job.model.js
│   └── application.model.js
├── routes/
│   ├── user.routes.js
│   ├── resume.routes.js
│   ├── preference.routes.js
│   ├── job.routes.js
│   └── application.routes.js
├── services/
│   └── jobFetcher.service.js       # Arbeitnow ingestion + skill extraction
├── middleware/
│   ├── auth.middleware.js
│   └── error.middleware.js
├── utils/
│   ├── asyncHandler.js
│   ├── ApiError.js
│   ├── ApiResponse.js
│   ├── llmClient.js                # reusable Groq API caller
│   └── cloudinary.js
├── app.js
└── index.js
```

---

## API overview

| Route | Method | Description |
|---|---|---|
| `/api/v1/user/register` | POST | Create an account |
| `/api/v1/user/login` | POST | Log in, returns access + refresh tokens |
| `/api/v1/user/refresh-token` | POST | Refresh an expired access token |
| `/api/v1/user/logout` | POST | Log out (protected) |
| `/api/v1/user/me` | GET | Current user (protected) |
| `/api/v1/resume/upload` | POST | Upload + parse a resume (protected) |
| `/api/v1/resume/my-resumes` | GET | List the user's resumes (protected) |
| `/api/v1/resume/set-active/:resumeId` | PATCH | Set the active resume (protected) |
| `/api/v1/resume/:resumeId` | DELETE | Delete a resume (protected) |
| `/api/v1/preference` | POST / GET | Set or fetch preferences (protected) |
| `/api/v1/job/refresh` | POST | Pull fresh listings from the job board API (protected) |
| `/api/v1/job/matched` | GET | Get scored, matched jobs for the active resume (protected) |
| `/api/v1/application/generate/:jobId` | POST | Generate application materials for a job (protected) |
| `/api/v1/application/mark-applied/:applicationId` | PATCH | Mark an application as applied (protected) |
| `/api/v1/application/my-applications` | GET | List the user's applications (protected) |
| `/api/v1/application/:applicationId` | GET | Get a single application's detail (protected) |

All protected routes require `Authorization: Bearer <accessToken>`.

---

## Getting started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)
- A [Groq](https://console.groq.com/) API key (free tier)
- A [Cloudinary](https://cloudinary.com/) account

### Setup

```bash
git clone https://github.com/yashsharma954/applyinterviewaibackend.git
cd applyinterviewaibackend
npm install
```

### Environment variables

Create a `.env` file in the project root:

```
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=http://localhost:5173

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

GROQ_API_KEY=your_groq_api_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Run locally

```bash
npm run dev
```

Server runs at `http://localhost:8000`.

---

## Deployment

Deployed on **Render**.

1. Connect the repo, set the build command to `npm install` and the start command to `npm start`
2. Add all environment variables above in the Render dashboard
3. Update `CORS_ORIGIN` to the deployed frontend's URL once it's live
4. In MongoDB Atlas → Network Access, allow `0.0.0.0/0` so Render can connect

> The free Render tier spins down after inactivity — the first request after idle time may take 30–50 seconds while it cold-starts.

---

## Design notes

- All LLM calls go through a single reusable client (`utils/llmClient.js`), making it straightforward to swap providers without touching controller code
- Application materials (resume points, cover letter, why-company answer, LinkedIn message) are generated in **one LLM call per job**, not four separate calls, to control latency and cost
- `Application` documents are unique per `(user, job)` pair, enforced with a compound index, so re-matching never creates duplicates
- Job skill matching normalizes case/whitespace before comparing, and falls back to unfiltered top matches if a strict preference filter returns nothing — the dashboard should never appear empty

---

## License

Built as a personal portfolio project.
