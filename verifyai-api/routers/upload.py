from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Header
from supabase import create_client
from typing import Optional
import os, time

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
    authorization: Optional[str] = Header(None),
):
    """
    Accept candidate details + CV file.
    Saves candidate to Supabase, stores CV, runs AI analysis immediately.
    """
    sb = get_supabase()

    # Verify the caller's JWT and extract their user ID server-side.
    # Never trust a user_id supplied in the request body.
    user_id = ""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        try:
            user_response = sb.auth.get_user(token)
            user_id = user_response.user.id
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
    else:
        raise HTTPException(status_code=401, detail="Authentication required")

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
    if file_bytes and filename:
        ext = filename.rsplit(".", 1)[-1].lower()
        file_path = f"cvs/{candidate_id}/{int(time.time())}.{ext}"

        for bucket in ["cvs", "CVS"]:
            try:
                sb.storage.from_(bucket).upload(file_path, file_bytes, {"content-type": file.content_type})
                print(f"[Upload] CV saved to storage bucket '{bucket}' at {file_path}")
                break
            except Exception as e:
                print(f"[Upload] Storage bucket '{bucket}' failed: {e}")

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
        "cv_uploaded": file_bytes is not None,
        "message": "Candidate saved — AI analysis running, check the analysis page in ~30 seconds"
    }
