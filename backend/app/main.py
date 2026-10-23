from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base, SessionLocal
from .config import UPLOAD_DIR
from .api.endpoints import router as api_router
from .services.digilocker_mock import MockRegistryService

# Initialize database schema tables
Base.metadata.create_all(bind=engine)

# Seed initial DigiLocker / APAAR registry records
with SessionLocal() as db:
    MockRegistryService.seed_defaults(db)

app = FastAPI(
    title="SIH26261: AI-Powered Application Validation & Document Authentication",
    description="Automated OCR, Forensic Tamper Detection (ELA, EXIF, Splicing), DigiLocker/APAAR Registry Cross-Verification, and Multi-Factor Trust Scoring.",
    version="1.0.0"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory to serve document images and ELA heatmaps
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include API router
app.include_router(api_router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "document-authentication-engine"}

# Unified Production Serving: Check if frontend/dist exists
from pathlib import Path
from fastapi.responses import FileResponse

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    # Mount frontend assets
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend_assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Don't intercept API or upload routes
        if full_path.startswith("api/") or full_path.startswith("uploads/"):
            return None
        candidate_file = FRONTEND_DIST / full_path
        if candidate_file.is_file():
            return FileResponse(candidate_file)
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "system": "AI-Powered Application Validation and Document Authentication",
            "problem_statement": "SIH26261",
            "status": "ONLINE",
            "docs_url": "/docs",
            "endpoints": [
                "/api/v1/applications",
                "/api/v1/upload-document",
                "/api/v1/analyze-document/{doc_id}",
                "/api/v1/verify-document/{doc_id}",
                "/api/v1/verify-trust-score/{app_id}",
                "/api/v1/pipeline/run-full/{app_id}",
                "/api/v1/review-decision/{app_id}"
            ]
        }
