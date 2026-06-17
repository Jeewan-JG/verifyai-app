from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="Verify.AI API",
    description="Backend API for VerifyAI — CV fraud detection platform",
    version="0.1.0"
)

# Allow requests from the Vite dev server and production frontend
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
from routers import candidates, upload, analysis, reports

app.include_router(candidates.router, prefix="/candidates", tags=["Candidates"])
app.include_router(upload.router,     prefix="/upload",     tags=["Upload"])
app.include_router(analysis.router,   prefix="/analysis",   tags=["Analysis"])
app.include_router(reports.router,    prefix="/reports",    tags=["Reports"])

@app.get("/")
def root():
    return {"status": "ok", "service": "Verify.AI API", "version": "0.1.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
