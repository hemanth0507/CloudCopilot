from fastapi import APIRouter
from data import processor

router = APIRouter()

@router.get("/")
def get_all_resources(limit: int = 100, offset: int = 0):
    data = processor.get_all_resources(limit=limit, offset=offset)
    return {
        "status": "success",
        "count": len(data),
        "data": data,
        "insight": "General resource inventory across all cloud providers.",
        "recommendation": "Use filters to narrow down specific resource types."
    }

@router.get("/idle")
def get_idle_resources(limit: int = 100, offset: int = 0):
    data = processor.get_idle_resources(limit=limit, offset=offset)
    return {
        "status": "success",
        "count": len(data),
        "data": data,
        "insight": f"Found {len(data)} idle resources with low utilization.",
        "recommendation": "Terminate or right-size these resources to save costs."
    }

@router.get("/{id}")
def get_resource_by_id(id: str):
    res = processor.get_resource_by_id(id)
    if not res:
        return {"status": "error", "message": "Resource not found"}
    return {
        "status": "success",
        "data": res,
        "insight": "Detailed configuration snapshot for the selected resource.",
        "recommendation": "Verify security group rules for this specific instance."
    }
