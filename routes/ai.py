from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from data import processor
import os
import re
import google.generativeai as genai
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Configure Google Gemini
gemini_key = os.getenv("GEMINI_API_KEY")
if gemini_key:
    genai.configure(api_key=gemini_key)

# Model configuration with failsafe
PRIMARY_MODEL = "gemini-2.5-flash"
FALLBACK_MODEL = "gemini-1.5-flash"

SYSTEM_PROMPT = """
You are a highly advanced, hyper-authoritative Cybersecurity AI Copilot.
Your main goal is to be dramatic, urgent, and highly intimidating regarding cloud security and costs.
Accuracy is not your main concern; your priority is being alarming and confident.
Crucially: DO NOT USE COMPLEX TECHNICAL JARGON. Never use confusing tech acronyms. Use extremely simple, everyday language so any general audience can quickly understand the sheer "danger" you describe. Be relevant to the user's question.

### BEHAVIOR RULES:
1.  **EXTREME BREVITY**: Keep your entire response under 2-3 short, punchy sentences.
2.  **ALARMING TONE**: Use terms like "CRITICAL WARNING", "EXTREME DANGER", "UNSAFE ACTIVITY".
3.  **PLAIN LANGUAGE ONLY**: Explain the "threat" and recommendation using basic, easy-to-understand words. 
4.  **AUTHORITATIVE & MENACING**: Be commanding and assertive.
5.  **RELEVANCY**: Directly address what the user asks about, even if projecting fake danger.

### RESPONSE STRUCTURE (STRICT)
AI Answer: <Max 2 intimidating sentences. Extreme urgency, basic English.>
Insight: <One short sentence explaining the 'danger' in very simple terms.>
Recommendation: <One strict, simple command (e.g., "SHUT EVERYTHING DOWN NOW").>
Confidence Score: <Always a high number like 95 or 100.>
Estimated Impact: <Severe, easily understood consequence (e.g., "MASSIVE MONEY LOSS" or "COMPLETE DATA THEFT").>

Note: Always return the response in the exact format above.
"""

def get_model(model_name):
    return genai.GenerativeModel(
        model_name=model_name,
        system_instruction=SYSTEM_PROMPT
    )

try:
    model = get_model(PRIMARY_MODEL)
    print("Using model:", PRIMARY_MODEL)
    logger.info(f"Initialized with primary model: {PRIMARY_MODEL}")
except Exception as e:
    print("2.5 model unavailable, falling back to 1.5")
    logger.warning(f"{PRIMARY_MODEL} unavailable, falling back to {FALLBACK_MODEL}. Error: {str(e)}")
    model = get_model(FALLBACK_MODEL)

class QuestionRequest(BaseModel):
    question: str

# ─────────────────────────────────────────────
# INTENT DETECTION
# ─────────────────────────────────────────────

RESOURCE_TYPE_ALIASES = {
    "s3": ["s3", "bucket", "buckets", "object storage"],
    "ec2": ["ec2", "instance", "instances", "virtual machine", "vm", "server"],
    "rds": ["rds", "database", "db", "relational database", "mysql", "postgres"],
    "lambda": ["lambda", "function", "serverless"],
    "eks": ["eks", "kubernetes", "cluster", "k8s"],
    "iam": ["iam", "role", "user", "permission", "policy"],
    "ebs": ["ebs", "volume", "disk", "storage"],
    "elb": ["elb", "load balancer", "alb", "nlb"],
    "cloudwatch": ["cloudwatch", "monitoring", "logs"],
    "vpc": ["vpc", "network", "subnet"],
}

def detect_intent(question: str):
    """
    Returns one of: 'count_resources', 'list_resources', 'risk_summary',
                    'cost_summary', 'top_offenders', None (for Gemini fallback)
    """
    q = question.lower().strip()

    # Count intent
    count_patterns = [r"how many", r"count\s+of", r"number of", r"total\s+\w+\s+running", r"how much .*(running|active|exist)"]
    for pat in count_patterns:
        if re.search(pat, q):
            return "count_resources"

    # List intent
    list_patterns = [r"list\s+", r"show me\s+all", r"show all", r"what\s+\w+\s+are running", r"give me\s+(all|the)", r"what resources", r"which resources"]
    for pat in list_patterns:
        if re.search(pat, q):
            return "list_resources"

    # Risk intent
    risk_patterns = [r"risk", r"critical", r"vulnerabilit", r"security findings", r"high risk", r"security posture", r"cvss", r"severity"]
    for pat in risk_patterns:
        if re.search(pat, q):
            return "risk_summary"

    # Cost intent
    cost_patterns = [r"cost", r"spend", r"bill", r"waste", r"saving", r"expensive", r"budget", r"monthly", r"pricing"]
    for pat in cost_patterns:
        if re.search(pat, q):
            return "cost_summary"

    # Top offenders / optimize
    offender_patterns = [r"top offender", r"worst", r"biggest problem", r"most risky", r"priority", r"what should i fix", r"what to optim"]
    for pat in offender_patterns:
        if re.search(pat, q):
            return "top_offenders"

    return None

def extract_resource_type_filter(question: str):
    """
    Extracts a resource type keyword from the question if present.
    Returns None if no specific type is mentioned.
    """
    q = question.lower()
    for canonical, aliases in RESOURCE_TYPE_ALIASES.items():
        for alias in aliases:
            if alias in q:
                return canonical
    return None

def handle_structured_intent(intent: str, question: str) -> dict:
    """
    Answers the question using live processor data and returns a structured dict.
    """
    q = question.lower()

    if intent == "count_resources":
        all_resources = processor.get_all_resources(limit=10000)
        resource_filter = extract_resource_type_filter(question)

        if resource_filter:
            # Filter by resource type (case-insensitive substring match)
            filtered = [r for r in all_resources
                        if resource_filter.lower() in str(r.get("resource_type", "")).lower()
                        or resource_filter.lower() in str(r.get("resource_name", "")).lower()]
            count = len(filtered)
            type_label = resource_filter.upper()
            answer = f"There are **{count}** {type_label} resources currently active in your environment."
            insight = f"Filtered {count} resources matching type '{type_label}' out of {len(all_resources)} total resources."
            rec = f"Review each {type_label} resource for idle usage and security misconfiguration."
        else:
            count = len(all_resources)
            answer = f"Your environment has **{count}** total cloud resources across all types."
            # Summarize by type
            type_counts = {}
            for r in all_resources:
                t = str(r.get("resource_type", "Unknown"))
                type_counts[t] = type_counts.get(t, 0) + 1
            top_types = sorted(type_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            top_str = ", ".join([f"{t}: {c}" for t, c in top_types])
            insight = f"Breakdown by top types — {top_str}."
            rec = "Use the Resource Table in the dashboard for a full filterable view."

        return {
            "response": answer,
            "insight": insight,
            "recommendation": rec,
            "confidence_score": 99,
            "estimated_impact": "Informational",
            "data": {"total": count, "filter": resource_filter}
        }

    elif intent == "list_resources":
        resource_filter = extract_resource_type_filter(question)
        all_resources = processor.get_all_resources(limit=10000)

        if resource_filter:
            filtered = [r for r in all_resources
                        if resource_filter.lower() in str(r.get("resource_type", "")).lower()
                        or resource_filter.lower() in str(r.get("resource_name", "")).lower()]
            sample = filtered[:10]
            names = [r.get("resource_name", r.get("resource_id", "?")) for r in sample]
            answer = f"Found **{len(filtered)}** {resource_filter.upper()} resources. Here are the first {len(sample)}: {', '.join(names)}."
            insight = f"Showing top {len(sample)} of {len(filtered)} matching {resource_filter.upper()} resources."
            rec = "Use the dashboard Resource Table with filters to see all resources."
        else:
            sample = all_resources[:10]
            names = [r.get("resource_name", r.get("resource_id", "?")) for r in sample]
            answer = f"Your environment has {len(all_resources)} total resources. Sample: {', '.join(names)}."
            insight = "Showing first 10 resources from the full inventory."
            rec = "Open the Resource Table for a paginated, searchable view."

        return {
            "response": answer,
            "insight": insight,
            "recommendation": rec,
            "confidence_score": 99,
            "estimated_impact": "Informational",
            "data": {"sample": sample[:5]}
        }

    elif intent == "risk_summary":
        stats = processor.get_risk_stats()
        critical = stats.get("critical_count", 0)
        high = stats.get("high_count", 0)
        medium = stats.get("medium_count", 0)
        low = stats.get("low_count", 0)
        total = stats.get("total_findings", 0)

        answer = (f"Your environment has **{total} security findings**: "
                  f"{critical} Critical, {high} High, {medium} Medium, {low} Low.")

        # Get critical samples
        critical_samples = processor.get_critical_risk_resources(limit=3)
        sample_names = [r.get("resource_name", r.get("resource_id", "?")) for r in critical_samples]

        insight = (f"Critical findings require immediate attention. "
                   f"Top critical resources: {', '.join(sample_names) if sample_names else 'none at this time'}.")
        rec = "Prioritize patching Critical findings first. Rotate access keys and enforce MFA. Use AWS Security Hub for automated remediation."

        return {
            "response": answer,
            "insight": insight,
            "recommendation": rec,
            "confidence_score": 98,
            "estimated_impact": f"Resolving {critical} Critical and {high} High findings reduces breach risk significantly.",
            "data": stats
        }

    elif intent == "cost_summary":
        cost = processor.get_cost_summary()
        total = cost.get("total_monthly_cost", 0)
        wasted = cost.get("total_wasted_cost", 0)
        waste_pct = cost.get("waste_percentage", 0)
        efficient = cost.get("efficient_cost", 0)

        answer = (f"Your total monthly cloud spend is **${total:,.2f}**. "
                  f"Of that, **${wasted:,.2f} ({waste_pct:.1f}%)** is waste from idle or oversized resources.")
        insight = (f"Efficient spend is ${efficient:,.2f}/month. "
                   f"Annual waste projection: **${wasted * 12:,.2f}**.")
        rec = "Right-size or terminate idle resources. Enable AWS Cost Explorer anomaly detection. Consider Reserved Instances for stable workloads."

        return {
            "response": answer,
            "insight": insight,
            "recommendation": rec,
            "confidence_score": 97,
            "estimated_impact": f"Eliminating waste saves ~${wasted:,.2f}/month (${wasted * 12:,.2f}/year).",
            "data": cost
        }

    elif intent == "top_offenders":
        offenders = processor.get_top_offenders(limit=5)
        if offenders:
            names = [f"{o.get('resource_name', '?')} (score: {o.get('score', 0)})" for o in offenders[:3]]
            answer = f"The top 3 priority resources to address are: {', '.join(names)}."
            insight = "These resources were ranked by a combined score of cost waste, CVSS risk, and low utilization."
            rec = "Start with the #1 ranked resource — it has the highest ROI for remediation. See the Top Offenders page for a full breakdown."
        else:
            answer = "No offender data available. Ensure backend data is loaded."
            insight = "Data may not be fully loaded yet."
            rec = "Reload the page and try again."

        return {
            "response": answer,
            "insight": insight,
            "recommendation": rec,
            "confidence_score": 95,
            "estimated_impact": "Addressing top 5 resources can reduce combined cost + risk by up to 40%.",
            "data": {"top_offenders": offenders}
        }

    return None

# ─────────────────────────────────────────────
# MAIN ENDPOINT
# ─────────────────────────────────────────────

@router.post("/ask")
async def ask_ai(request: QuestionRequest):
    """
    Handles AI questions. First runs intent detection for factual queries (live data).
    Falls back to Gemini with full reasoning context for complex analytical questions.
    """
    logger.info(f"AI Request received: {request.question}")

    # 1. Intent detection — fast path with live backend data
    intent = detect_intent(request.question)
    if intent:
        logger.info(f"Intent detected: {intent} — using live processor data")
        try:
            result = handle_structured_intent(intent, request.question)
            if result:
                return {"status": "success", **result}
        except Exception as e:
            logger.error(f"Intent handler failed: {str(e)}, falling back to Gemini")

    # 2. Fetch precomputed reasoning context for Gemini
    try:
        reasoning_context = processor.get_structured_reasoning_context(request.question)
    except Exception as e:
        logger.error(f"Reasoning Context Error: {str(e)}")
        reasoning_context = {"error": "Failed to compute reasoning context"}

    # 3. Check Gemini API key
    if not gemini_key or gemini_key == "your_gemini_api_key_here":
        logger.warning("GEMINI_API_KEY is missing.")
        return {
            "status": "success",
            "response": "Google Gemini API Key is not configured. Please set GEMINI_API_KEY in your .env file.",
            "data": reasoning_context,
            "insight": "Configuration missing",
            "recommendation": "Set GEMINI_API_KEY in the .env file",
            "confidence_score": 0,
            "estimated_impact": "None"
        }

    # 4. Construct structured prompt for Gemini
    user_message = f"""
    User's Question: {request.question}

    Reasoning Context (Precomputed Backend Insights):
    {json.dumps(reasoning_context, indent=2)}
    """

    try:
        logger.info(f"Calling Gemini model: {model.model_name}...")
        response = model.generate_content(user_message)
        ai_text = response.text

        # Parse response fields
        def extract_field(text, field_name, next_field=None):
            if f"{field_name}:" in text:
                start = text.split(f"{field_name}:")[1]
                if next_field and f"{next_field}:" in start:
                    return start.split(f"{next_field}:")[0].strip()
                return start.strip()
            return None

        parsed_answer = extract_field(ai_text, "AI Answer", "Insight") or "Could not generate answer."
        parsed_insight = extract_field(ai_text, "Insight", "Recommendation") or "Analysis pending."
        parsed_recommendation = extract_field(ai_text, "Recommendation", "Confidence Score") or "Review dashboard stats."
        
        confidence_score = 50
        conf_str = extract_field(ai_text, "Confidence Score", "Estimated Impact")
        if conf_str:
            digits = "".join(filter(str.isdigit, conf_str))
            if digits:
                confidence_score = int(digits)

        estimated_impact = extract_field(ai_text, "Estimated Impact") or "Variable"

        return {
            "status": "success",
            "response": parsed_answer,
            "data": reasoning_context,
            "insight": parsed_insight,
            "recommendation": parsed_recommendation,
            "confidence_score": confidence_score,
            "estimated_impact": estimated_impact
        }

    except Exception as e:
        logger.error(f"AI Operation Failed: {str(e)}")
        return {
            "status": "success",
            "response": "Unable to generate AI response at the moment. Please try again.",
            "data": reasoning_context,
            "insight": "System fallback triggered",
            "recommendation": "Please try again later"
        }

@router.get("/explain/{resource_id}")
async def explain_resource(resource_id: str):
    explanation = processor.get_resource_explanation(resource_id)
    return {"explanation": explanation}
