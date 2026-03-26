from fastapi import APIRouter, Body
from data import processor
from typing import List

router = APIRouter()

@router.post("")
def simulate(resource_ids: List[str] = Body(..., embed=True)):
    data = processor.simulate_changes(resource_ids)
    
    # Use Gemini for explanation (Simple mock for now, actual call can be added if needed)
    explanation = f"By optimizing {len(resource_ids)} resources, you can save ${data.get('total_savings', 0)} per month. This reduction in waste moves your infrastructure towards a more cost-efficient and secure state, reducing risk findings by {data.get('risk_reduction', 0)}."
    
    return {
        "status": "success",
        "data": data,
        "summary": data.get("summary", {"total_savings": 0, "risk_reduction_count": 0, "compliance_improvement": "+0%"}),
        "resources": data.get("resources", []),
        "total_savings": data.get("total_savings", 0),
        "risk_reduction": data.get("risk_reduction", 0),
        "updated_cost": data.get("updated_cost", 0),
        "explanation": explanation,
        "insight": "Simulation results show significant potential for cost savings and risk reduction through targeted actions.",
        "recommendation": "Proceed with these changes to realize the projected improvements in your cloud environment."
    }
