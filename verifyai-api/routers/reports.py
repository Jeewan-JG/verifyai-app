from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list_reports():
    """Return all generated reports."""
    # TODO: Fetch from Supabase reports table
    return {"reports": [], "demo": True}

@router.post("/generate/{candidate_id}")
def generate_report(candidate_id: str):
    """Generate a PDF trust report for a candidate."""
    # TODO: Generate PDF with reportlab and store in Supabase Storage
    return {"status": "queued", "candidate_id": candidate_id, "message": "Report generation queued"}
