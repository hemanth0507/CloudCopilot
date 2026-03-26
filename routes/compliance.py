from fastapi import APIRouter
from data import processor

router = APIRouter()

@router.get("")
def get_compliance():
    data = processor.get_compliance_scores()
    return {
        "status": "success",
        "data": data,
        "insight": "Compliance scores calculated based on security configuration checks against framework controls.",
        "recommendation": "Focus on failed controls to improve your security posture and meet regulatory requirements."
    }
