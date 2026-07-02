from fastapi import APIRouter, HTTPException, Depends
import os
from supabase import create_client
from auth import require_user, require_candidate_owner

router = APIRouter()

def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key or "placeholder" in url:
        return None
    return create_client(url, key)

@router.get("/")
def list_candidates(user=Depends(require_user)):
    """Return the calling user's candidates."""
    sb = get_supabase()
    if not sb:
        # Demo mode — return mock data
        return {"candidates": [], "demo": True, "message": "Configure Supabase to see real data"}
    query = sb.table("candidates").select(
        "id, full_name, email, role, location, status, linkedin_url, created_at"
    ).order("created_at", desc=True)
    # Admins see everything; everyone else only their own candidates
    if (user.app_metadata or {}).get("role") != "admin":
        query = query.eq("user_id", user.id)
    result = query.execute()
    return {"candidates": result.data}

@router.get("/{candidate_id}")
def get_candidate(candidate_id: str, user=Depends(require_user)):
    """Return a single candidate by ID (owner only)."""
    sb = get_supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database not configured")
    candidate = require_candidate_owner(candidate_id, user)
    analysis = sb.table("analysis_results").select("*").eq("candidate_id", candidate_id).execute()
    candidate["analysis_results"] = analysis.data or []
    return candidate
