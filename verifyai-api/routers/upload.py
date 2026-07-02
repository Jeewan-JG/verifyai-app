from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from supabase import create_client
from typing import Optional
import os, time
from auth import require_active_plan

router = APIRouter()

ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
}
MAX_SIZE_MB = 15

def get_supabase():
    return create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))



@router.post("/")
async def upload_cv(
    background_tasks: BackgroundTasks,
    full_name: str = Form(...),
    email: str = Form(""),
    role: str = Form(""),
    location: str = Form(""),
    file: Optional[UploadFile] = File(None),
    user=Depends(require_active_plan),
):
    """
    Accept candidate details + CV file.
    Saves candidate to Supabase, stores CV, runs AI analysis immediately.
    Caller must have a valid JWT and an active trial or paid plan — the
    user ID always comes from the verified token, never the request body.
    """
    sb = get_supabase()
    user_id = user.id

    # 1. Validate file BEFORE inserting the candidate row so a bad upload
    #    never leaves an orphaned candidate record in the database.
    file_bytes = None
    filename = None
    if file and file.filename:
        content = await file.read()
        size_mb = len(content) / (1024 * 1024)
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, DOCX or TXT.")
        if size_mb > MAX_SIZE_MB:
            raise HTTPException(status_code=400, detail=f"File too large ({size_mb:.1f}MB). Max 15MB.")
        filename = file.filename
        file_bytes = content

    # 2. Insert candidate (validation passed — no orphaned rows)
    candidate_data = {
        "full_name": full_name,
        "email":     email or None,
        "role":      role or None,
        "location":  location or None,
        "status":    "pending",
        "user_id":   user_id,
    }

    res = sb.table("candidates").insert(candidate_data).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to save candidate")

    candidate_id = res.data[0]["id"]

    # 3. Store the CV file (bytes already read and validated above)
    cv_stored = False
    if file_bytes and filename:
        ext = filename.rsplit(".", 1)[-1].lower()
        file_path = f"cvs/{candidate_id}/{int(time.time())}.{ext}"

        for bucket in ["cvs", "CVS"]:
            try:
                sb.storage.from_(bucket).upload(file_path, file_bytes, {"content-type": file.content_type})
                print(f"[Upload] CV saved to storage bucket '{bucket}' at {file_path}")
                cv_stored = True
                break
            except Exception as e:
                print(f"[Upload] Storage bucket '{bucket}' failed: {e}")
        if not cv_stored:
            print(f"[Upload] WARNING: CV file for candidate {candidate_id} could not be stored in any bucket")

    # 3. Extract CV text and save it to the candidate record
    if file_bytes and filename:
        from routers.analysis import extract_text_from_bytes
        cv_text = extract_text_from_bytes(file_bytes, filename)
        if cv_text and len(cv_text.strip()) > 30:
            sb.table("candidates").update({"cv_text": cv_text}).eq("id", candidate_id).execute()

    # 4. Run full analysis (CV + link verification) in background.
    #    _run_analysis_job reads cv_text from the DB (saved above) so it produces
    #    the same result structure as a manual rerun — including link_verification.
    from routers.analysis import _run_analysis_job
    background_tasks.add_task(_run_analysis_job, candidate_id)

    return {
        "status": "ok",
        "candidate_id": candidate_id,
        "full_name": full_name,
        # cv_uploaded reflects whether the file actually landed in storage —
        # cv_text extraction (step 3) can still succeed even if storage failed.
        "cv_uploaded": cv_stored,
        "message": "Candidate saved — AI analysis running, check the analysis page in ~30 seconds"
    }
