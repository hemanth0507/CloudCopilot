from fastapi import APIRouter
from data import processor

router = APIRouter()

@router.get("/")
def get_risks(limit: int = 100, offset: int = 0):
    data = processor.get_high_risk_resources(limit=limit, offset=offset)
    return {
        "status": "success",
        "count": len(data),
        "data": data,
        "insight": "High and Critical risk findings across the environment.",
        "recommendation": "Prioritize patching for resources with 'Critical' findings."
    }

@router.get("/critical")
def get_critical_risks(limit: int = 100, offset: int = 0):
    data = processor.get_critical_risk_resources(limit=limit, offset=offset)
    return {
        "status": "success",
        "count": len(data),
        "data": data,
        "insight": "Resources requiring immediate attention due to critical exposures.",
        "recommendation": "Rotate credentials and apply vendor security patches immediately."
    }

@router.get("/stats")
def get_risk_stats():
    stats = processor.get_risk_stats()
    return {
        "status": "success",
        "data": stats,
        "insight": "Severity distribution of current security findings.",
        "recommendation": "Target a 50% reduction in Critical findings by next sprint."
    }
