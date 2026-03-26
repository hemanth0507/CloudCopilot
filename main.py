from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv(override=True)

from routes import resources, risks, cost, alerts, insights, ai, compliance, simulate, recommendations, decisions
from data.loader import load_datasets

app = FastAPI(title="GenAI Cloud Security Copilot Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    load_datasets()

app.include_router(resources.router, prefix="/resources", tags=["Resources"])
app.include_router(risks.router, prefix="/risks", tags=["Risks"])
app.include_router(cost.router, prefix="/cost", tags=["Cost"])
app.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
app.include_router(insights.router, prefix="/insights", tags=["Insights"])
app.include_router(compliance.router, prefix="/compliance", tags=["Compliance"])
app.include_router(simulate.router, prefix="/simulate", tags=["Simulator"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
app.include_router(decisions.router, prefix="/decisions", tags=["Decisions"])
app.include_router(ai.router, prefix="", tags=["AI"])

@app.get("/")
def root():
    return {"status": "ok", "message": "GenAI Cloud Security Copilot Backend is running."}

# Triggering reload for new API key in .env
