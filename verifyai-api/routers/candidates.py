from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from supabase import create_client

router = APIRouter()

def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key or "placeholder" in url:
        return None
    return create_client(url, key)

@router.get("/")
def list_candidates():
    """Return all candidates from Supabase."""
    sb = get_supabase()
    if not sb:
        # Demo mode — return mock data
        return {"candidates": [], "demo": True, "message": "Configure Supabase to see real data"}
    result = sb.table("candidates").select("*").order("created_at", desc=True).execute()
    return {"candidates": result.data}

@router.get("/{candidate_id}")
def get_candidate(candidate_id: str):
    """Return a single candidate by ID."""
    sb = get_supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database not configured")
    result = sb.table("candidates").select("*, analysis_results(*)").eq("id", candidate_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return result.data
