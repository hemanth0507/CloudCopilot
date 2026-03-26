from fastapi import APIRouter
from data import processor

router = APIRouter()

@router.get("/combined")
def get_combined_insights(limit: int = 50, offset: int = 0):
    data = processor.join_resource_insights(limit=limit, offset=offset)
    return {
        "status": "success",
        "count": len(data),
        "data": data,
        "insight": "Combined telemetry from inventory, utilization, and cost datasets.",
        "recommendation": "Use this unified view to identify correlation between high cost and low usage."
    }

@router.get("/priority")
def get_priority_insights(limit: int = 5):
    """
    Returns the top N high-priority resources based on cost, risk, and utilization.
    """
    data = processor.get_priority_resources(limit=limit)
    return {
        "status": "success",
        "count": len(data),
        "data": data,
        "insight": "Priority issues identified based on normalized scoring of cost impact, security risk, and utilization.",
        "recommendation": "Address Critical and High priority issues immediately to optimize both cost and security."
    }

@router.get("/top-offenders")
def get_top_offenders(limit: int = 10):
    data = processor.get_top_offenders(limit=limit)
    return {
        "status": "success",
        "count": len(data),
        "data": data,
        "insight": "Top 10 cloud resources identified as high-priority offenders based on cost, risk, and waste.",
        "recommendation": "Review these resources first for immediate cost savings and risk reduction."
    }

@router.get("/dashboard-scatter")
def get_dashboard_scatter():
    """
    Returns per-resource cost vs risk scatter data for the insight bubble chart.
    """
    data = processor.get_cost_risk_scatter()
    return {
        "status": "success",
        "count": len(data),
        "data": data,
        "insight": "Cost vs risk positioning of all cloud resources. High-right quadrant = highest priority.",
        "recommendation": "Focus remediation efforts on resources in the high-cost, high-risk quadrant."
    }

@router.get("/time-trend")
def get_time_trend():
    """
    Returns monthly aggregated cost, risk, and compliance trends.
    """
    data = processor.get_time_trend()
    return {
        "status": "success",
        "count": len(data),
        "data": data,
        "insight": "Temporal view of cost, risk, and compliance posture over recent months.",
        "recommendation": "Track compliance score trend — a declining score signals growing security debt."
    }
