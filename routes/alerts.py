from fastapi import APIRouter
from data import processor

router = APIRouter()

@router.get("/")
def get_alerts(limit: int = 100, offset: int = 0):
    data = processor.get_alerts(limit=limit, offset=offset)
    return {
        "status": "success",
        "count": len(data),
        "data": data,
        "insight": "Recent security and operational alerts.",
        "recommendation": "Ensure all high-severity alerts have assigned owners."
    }
