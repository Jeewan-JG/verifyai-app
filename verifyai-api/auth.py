"""Shared authentication dependencies for all API routes.

Every route must verify the caller's Supabase JWT — the API uses the
service-role key, which bypasses RLS, so route-level checks are the only
thing standing between a caller and other tenants' data.
"""
from fastapi import Header, HTTPException, Depends
from supabase import create_client
from datetime import datetime, timezone
from typing import Optional
import os

def get_supabase():
    return create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))


def require_user(authorization: Optional[str] = Header(None)):
    """Validate the Bearer token and return the Supabase user object."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization.split(" ", 1)[1]
    try:
        user = get_supabase().auth.get_user(token).user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


def require_active_plan(user=Depends(require_user)):
    """Allow only paid users, admins, or users inside their trial window.

    trial_ends_at lives in app_metadata (service-role writable only) so
    users cannot extend their own trial from the client.
    """
    meta = user.app_metadata or {}
    if meta.get("plan") == "paid" or meta.get("role") == "admin":
        return user

    trial_ends_at = meta.get("trial_ends_at")
    if trial_ends_at:
        try:
            ends = datetime.fromisoformat(trial_ends_at.replace("Z", "+00:00"))
            if ends > datetime.now(timezone.utc):
                return user
        except ValueError:
            pass

    raise HTTPException(status_code=402, detail="Trial expired — upgrade to continue")


def require_candidate_owner(candidate_id: str, user) -> dict:
    """Fetch a candidate and verify it belongs to the calling user."""
    sb = get_supabase()
    res = sb.table("candidates").select("*").eq("id", candidate_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Candidate not found")
    candidate = res.data[0]
    # Admins may access any candidate; everyone else only their own
    meta = user.app_metadata or {}
    if candidate.get("user_id") != user.id and meta.get("role") != "admin":
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate
