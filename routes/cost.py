from fastapi import APIRouter
from data import processor

router = APIRouter()

@router.get("/summary")
def get_cost_summary():
    data = processor.get_cost_summary()
    return {
        "status": "success",
        "data": data,
        "insight": data.get("summary", "No summary available."),
        "recommendation": data.get("recommendation", "No recommendation available.")
    }
