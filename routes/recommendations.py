from fastapi import APIRouter
from data import processor

router = APIRouter()

@router.get("/rightsizing")
def get_rightsizing():
    data = processor.get_rightsizing_recommendations()
    return {
        "status": "success",
        "count": len(data),
        "data": data,
        "insight": "Rightsizing opportunities identified for under-utilized resources based on CPU metrics.",
        "recommendation": "Switch to smaller instance types for these resources to reduce unnecessary cloud spend."
    }
