from fastapi import APIRouter
from data import processor

router = APIRouter()

@router.get("/top")
async def get_top_decision():
    decision = processor.get_top_decision()
    if not decision:
        return {"status": "error", "message": "No decision available"}
    return {"status": "success", "data": decision}
