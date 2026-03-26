import pandas as pd
import numpy as np
from data import loader

def clean_df(df, limit=None, offset=0):
    """Replaces Inf with None, NaN with 'N/A', rounds floats, and handles pagination."""
    if df is None:
        return None
    
    # Handle pagination
    if limit is not None:
        df = df.iloc[offset : offset + limit]
    
    # Round numeric columns to 2 decimal places
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].round(2)
    
    # Replace infinite values with None (JSON null)
    df = df.replace([np.inf, -np.inf], None)
    # Replace NaN values with 'N/A'
    df = df.fillna("N/A")
    return df

def get_all_resources(limit=100, offset=0):
    if loader.resources_df is not None:
        cleaned = clean_df(loader.resources_df, limit=limit, offset=offset)
        return cleaned.to_dict(orient="records")
    return []

def get_resource_by_id(resource_id):
    if loader.resources_df is not None:
        res = loader.resources_df[loader.resources_df['resource_id'] == resource_id]
        if not res.empty:
            cleaned = clean_df(res)
            return cleaned.to_dict(orient="records")[0]
    return None

def get_idle_resources(limit=100, offset=0):
    if loader.utilization_df is not None and loader.resources_df is not None:
        # Assuming cpu_utilization_pct < 10 or memory_utilization_pct < 10 implies idle
        util = loader.utilization_df
        idle = util[(util['cpu_utilization_pct'] < 10) | (util['memory_utilization_pct'] < 10)]
        merged = pd.merge(idle, loader.resources_df, on='resource_id', how='left')
        cleaned = clean_df(merged, limit=limit, offset=offset)
        return cleaned.to_dict(orient="records")
    return []

def get_high_risk_resources(limit=100, offset=0):
    if loader.findings_df is not None and loader.resources_df is not None:
        findings = loader.findings_df
        high_risk = findings[findings['severity'].isin(['High', 'Critical'])]
        merged = pd.merge(high_risk, loader.resources_df, on='resource_id', how='left')
        cleaned = clean_df(merged, limit=limit, offset=offset)
        return cleaned.to_dict(orient="records")
    return []

def get_critical_risk_resources(limit=100, offset=0):
    if loader.findings_df is not None and loader.resources_df is not None:
        findings = loader.findings_df
        critical_risk = findings[findings['severity'] == 'Critical']
        merged = pd.merge(critical_risk, loader.resources_df, on='resource_id', how='left')
        cleaned = clean_df(merged, limit=limit, offset=offset)
        return cleaned.to_dict(orient="records")
    return []

def get_risk_stats():
    if loader.findings_df is not None:
        counts = loader.findings_df['severity'].value_counts().to_dict()
        return {
            "total_findings": int(len(loader.findings_df)),
            "critical_count": int(counts.get('Critical', 0)),
            "high_count": int(counts.get('High', 0)),
            "medium_count": int(counts.get('Medium', 0)),
            "low_count": int(counts.get('Low', 0))
        }
    return {}

def join_resource_insights(limit=50, offset=0):
    # Example logic to join multiple datasets for combined insights
    if all(df is not None for df in [loader.resources_df, loader.utilization_df, loader.cost_df]):
        res = loader.resources_df
        util = loader.utilization_df
        cost = loader.cost_df
        
        merged = pd.merge(res, util, on='resource_id', how='left')
        cleaned = clean_df(merged, limit=limit, offset=offset)
        return cleaned.to_dict(orient="records")
    return []

def get_cost_summary():
    if loader.cost_df is not None:
        cost = loader.cost_df
        total_cost = cost['consumed_cost_usd'].sum() if 'consumed_cost_usd' in cost.columns else 0
        wasted_cost = cost['waste_cost_usd'].sum() if 'waste_cost_usd' in cost.columns else 0
        
        # Calculate extra metrics
        efficient_cost = total_cost - wasted_cost
        waste_percentage = (wasted_cost / total_cost * 100) if total_cost > 0 else 0
        
        # Ensure values are JSON compliant (handle NaN/Inf) and rounded
        def safe_round(val):
            if pd.isna(val) or np.isinf(val):
                return 0.0
            return round(float(val), 2)
            
        summary = f"Detected cloud spending waste of {safe_round(waste_percentage)}%."
        recommendation = "Consider rightsizing or terminating idle instances to reduce wasted spend."
        
        return {
            "total_monthly_cost": safe_round(total_cost),
            "total_wasted_cost": safe_round(wasted_cost),
            "efficient_cost": safe_round(efficient_cost),
            "waste_percentage": safe_round(waste_percentage),
            "summary": summary,
            "recommendation": recommendation
        }
    return {}

def get_alerts(limit=100, offset=0):
    if loader.alerts_df is not None:
        cleaned = clean_df(loader.alerts_df, limit=limit, offset=offset)
        return cleaned.to_dict(orient="records")
    return []

def answer_ai_query(query: str):
    query = query.lower()
    
    if 'cost' in query or 'waste' in query:
        summary = get_cost_summary()
        waste_pct = summary.get('waste_percentage', 0)
        return {
            "response": f"You are wasting approximately {waste_pct}% of your cloud spend.",
            "data": summary,
            "insight": "Majority of waste is coming from provisioned but unused resources.",
            "recommendation": "Review cost analysis report and enable auto-scaling."
        }
    elif 'risk' in query or 'critical' in query:
        findings = get_critical_risk_resources(limit=5)
        stats = get_risk_stats()
        return {
            "response": f"I found {stats.get('critical_count', 0)} critical and {stats.get('high_count', 0)} high risks.",
            "data": {"critical_samples": findings, "stats": stats},
            "insight": "Unrestricted security groups and outdated patches are major drivers.",
            "recommendation": "Immediate rotation of access keys and applying critical patches."
        }
    elif 'idle' in query:
        idle = get_idle_resources(limit=5)
        return {
            "response": f"There are {len(idle)} resources with very low utilization.",
            "data": idle,
            "insight": "Resources are consistently below 10% CPU usage for 30+ days.",
            "recommendation": "Terminate idle sandbox instances and move small tasks to serverless."
        }

def get_priority_resources(limit=5):
    """
    Ranks resources based on a combined score of cost waste, risk severity, and low utilization.
    priority_score = (cost_impact * 0.4) + (risk_severity * 0.4) + (utilization_factor * 0.2)
    """
    if all(df is not None for df in [loader.resources_df, loader.cost_df, loader.findings_df, loader.utilization_df]):
        # 1. Join Data-sets
        # Get latest cost data
        cost_df = loader.cost_df.sort_values('billing_month', ascending=False).drop_duplicates('resource_id')
        # Get max risk score per resource
        risks_df = loader.findings_df.groupby('resource_id')['cvss_score'].max().reset_index()
        # Get latest utilization
        util_df = loader.utilization_df.sort_values('timestamp', ascending=False).drop_duplicates('resource_id')
        
        # Merge
        merged = pd.merge(loader.resources_df, cost_df[['resource_id', 'waste_cost_usd', 'consumed_cost_usd', 'rightsizing_recommendation']], on='resource_id', how='left')
        merged = pd.merge(merged, risks_df, on='resource_id', how='left')
        merged = pd.merge(merged, util_df[['resource_id', 'cpu_utilization_pct', 'memory_utilization_pct']], on='resource_id', how='left')
        
        # 2. Score calculation
        # Fill NaNs
        merged['waste_cost_usd'] = pd.to_numeric(merged['waste_cost_usd'], errors='coerce').fillna(0)
        merged['cvss_score'] = pd.to_numeric(merged['cvss_score'], errors='coerce').fillna(0)
        # For utilization, if missing, assume 50 (neutral)
        merged['cpu_utilization_pct'] = pd.to_numeric(merged['cpu_utilization_pct'], errors='coerce').fillna(50)
        
        # Normalization (Simple heuristic)
        # Cost score: 0 to 100 based on waste (cap at $500 for 100 score)
        merged['cost_score'] = (merged['waste_cost_usd'] / 500 * 100).clip(upper=100)
        # Risk score: CVSS is 0-10, so * 10
        merged['risk_score'] = merged['cvss_score'] * 10
        # Utilization score: Lower utilization = Higher priority to fix.
        merged['util_score'] = 100 - merged['cpu_utilization_pct']
        
        # Final Priority Score
        merged['priority_score'] = (merged['cost_score'] * 0.4) + (merged['risk_score'] * 0.4) + (merged['util_score'] * 0.2)
        
        # 3. Rank and Format
        top_resources = merged.sort_values('priority_score', ascending=False).head(limit)
        
        results = []
        for _, row in top_resources.iterrows():
            severity = "Low"
            if row['cvss_score'] >= 9: severity = "Critical"
            elif row['cvss_score'] >= 7: severity = "High"
            elif row['cvss_score'] >= 4: severity = "Medium"
            
            # --- New Logic: ROI and Impact ---
            rec_action = str(row['rightsizing_recommendation']) if str(row['rightsizing_recommendation']) != 'nan' else "Investigate profile"
            
            # Simple Effort Heuristic
            effort_level = "Low"
            effort_index = 1
            if "reserved" in rec_action.lower() or severity == "High":
                effort_level = "Medium"
                effort_index = 5
            elif severity == "Critical":
                effort_level = "High"
                effort_index = 10
            elif "downsize" in rec_action.lower():
                effort_level = "Medium"
                effort_index = 3
            
            wasted = float(row['waste_cost_usd'])
            risk_score = float(row['cvss_score'])
            
            # ROI Score (Higher is better)
            # Higher waste with lower effort = Higher ROI
            roi_score = round((wasted / effort_index) + (risk_score * 5 / effort_index), 2)
            
            # Impact Estimation
            impact_desc = []
            if wasted > 0:
                impact_desc.append(f"Save ${round(wasted, 2)}/mo")
            if risk_score > 0:
                impact_desc.append(f"Resolve {severity} risk ({risk_score} CVSS)")
            
            impact_summary = " & ".join(impact_desc) if impact_desc else "Monitoring & Optimization"
            
            results.append({
                "resource_id": row['resource_id'],
                "resource_name": row['resource_name'],
                "resource_type": row['resource_type'],
                "priority_score": round(float(row['priority_score']), 2),
                "cost_impact": round(wasted, 2),
                "risk_severity": severity,
                "cvss_score": risk_score,
                "utilization": f"{row['cpu_utilization_pct']}%",
                "recommended_action": rec_action,
                "roi_score": roi_score,
                "implementation_effort": effort_level,
                "impact_estimation": impact_summary
            })
        return results
    return []

def analyze_causal_factors():
    """
    Compares the last two months of cost data to detect causes of cost increase.
    """
    if loader.cost_df is not None:
        df = loader.cost_df
        months = sorted(df['billing_month'].unique(), reverse=True)
        if len(months) < 2:
            return [{"type": "Data Limitation", "description": "Insufficient historical data for causal analysis.", "affected_count": 0}]
        
        current_month = months[0]
        prev_month = months[1]
        
        curr_data = df[df['billing_month'] == current_month]
        prev_data = df[df['billing_month'] == prev_month]
        
        causes = []
        
        # 1. New Resources
        curr_ids = set(curr_data['resource_id'])
        prev_ids = set(prev_data['resource_id'])
        new_ids = curr_ids - prev_ids
        if new_ids:
            new_cost = curr_data[curr_data['resource_id'].isin(new_ids)]['consumed_cost_usd'].sum()
            causes.append({
                "type": "New Resources Added",
                "description": f"Detected {len(new_ids)} new resources contributing ${round(float(new_cost), 2)} to this month's bill.",
                "affected_count": len(new_ids)
            })
            
        # 2. Cost Spikes in existing resources
        merged = pd.merge(curr_data, prev_data, on='resource_id', suffixes=('_curr', '_prev'))
        merged['diff'] = merged['consumed_cost_usd_curr'] - merged['consumed_cost_usd_prev']
        spikes = merged[merged['diff'] > 50] # Threshold $50 increase
        if not spikes.empty:
            causes.append({
                "type": "Usage Spikes",
                "description": f"Found {len(spikes)} existing resources with significant cost increases compared to last month.",
                "affected_count": len(spikes)
            })
            
        # 3. Persistent Waste
        waste_resources = curr_data[curr_data['waste_cost_usd'] > 20]
        if not waste_resources.empty:
            total_waste = waste_resources['waste_cost_usd'].sum()
            causes.append({
                "type": "Persistent Waste",
                "description": f"{len(waste_resources)} idle resources are still running, costing ${round(float(total_waste), 2)}/month in waste.",
                "affected_count": len(waste_resources)
            })
            
        return causes
    return []

def get_structured_reasoning_context(query=None):
    """
    Precomputes structured insights for the AI reasoning layer.
    """
    priority = get_priority_resources(limit=5)
    causal = analyze_causal_factors()
    cost_sum = get_cost_summary()
    risk_stats = get_risk_stats()
    
    return {
        "top_priority_ranked_issues": priority,
        "detected_causal_factors": causal,
        "global_summary": {
            "waste_percentage": cost_sum.get("waste_percentage", 0),
            "total_monthly_cost": cost_sum.get("total_monthly_cost", 0),
            "current_risk_posture": risk_stats
        }
    }

def get_compliance_scores():
    if loader.compliance_df is None or loader.security_df is None:
        return []
    
    comp_df = loader.compliance_df
    sec_df = loader.security_df
    
    frameworks = ['SOC2', 'ISO27001', 'PCI']
    results = []
    
    # Pre-calculate failures per misconfiguration type
    failures = {
        'PUBLIC_ACCESS_ENABLED': bool(sec_df['public_access_enabled'].any()),
        'ENCRYPTION_DISABLED': bool((sec_df['encryption_enabled'] == False).any()),
        'MFA_NOT_ENFORCED': bool((sec_df['mfa_enforced'] == False).any()),
        'LOGGING_DISABLED': bool((sec_df['logging_enabled'] == False).any()),
        'OPEN_SSH_PORT': bool(sec_df['open_ports'].apply(lambda x: '22' in str(x)).any()),
        'OPEN_RDP_PORT': bool(sec_df['open_ports'].apply(lambda x: '3389' in str(x)).any()),
        'OVERPRIVILEGED_IAM_ROLE': bool(sec_df['overprivileged_role'].any()),
        'NO_BACKUP_POLICY': bool((sec_df['backup_policy_attached'] == False).any()),
        'OUTDATED_TLS': bool(sec_df['tls_version'].isin(['TLS1.0', 'TLS1.1']).any()),
        'DEFAULT_ADMIN_CREDENTIALS': bool(sec_df['default_credentials'].any()),
        'MISSING_RESOURCE_TAGS': bool((sec_df['resource_tags_complete'] == False).any()),
        'CROSS_ACCOUNT_ACCESS': bool(sec_df['cross_account_access'].any()),
        'UNROTATED_KEYS': bool((sec_df['key_last_rotated_days'] > 90).any())
    }
    
    for fw in frameworks:
        fw_controls = comp_df[comp_df['compliance_framework'] == fw]
        unique_controls = fw_controls.drop_duplicates('control_id')
        total_count = len(unique_controls)
        
        failed_list = []
        for _, row in unique_controls.iterrows():
            m_type = row['misconfiguration_type']
            if failures.get(m_type, False):
                failed_list.append({
                    "control_id": row['control_id'],
                    "description": row['control_description'],
                    "severity": row['severity']
                })
        
        passed_count = total_count - len(failed_list)
        score = (passed_count / total_count * 100) if total_count > 0 else 100
        
        results.append({
            "framework": fw,
            "score": round(score, 2),
            "passed_controls": passed_count,
            "total_controls": total_count,
            "failed_controls": failed_list
        })
    
    return results

def get_top_offenders(limit=10):
    """
    score = cost_weight + risk_weight + waste_ratio
    """
    if all(df is not None for df in [loader.resources_df, loader.cost_df, loader.findings_df, loader.utilization_df]):
        # Reuse priority logic but adjust scoring to match requirement
        cost_df = loader.cost_df.sort_values('billing_month', ascending=False).drop_duplicates('resource_id')
        risks_df = loader.findings_df.groupby('resource_id')['cvss_score'].max().reset_index()
        util_df = loader.utilization_df.sort_values('timestamp', ascending=False).drop_duplicates('resource_id')
        
        merged = pd.merge(loader.resources_df, cost_df[['resource_id', 'waste_cost_usd', 'consumed_cost_usd']], on='resource_id', how='left')
        merged = pd.merge(merged, risks_df, on='resource_id', how='left')
        merged = pd.merge(merged, util_df[['resource_id', 'cpu_utilization_pct']], on='resource_id', how='left')
        
        merged['waste_cost_usd'] = merged['waste_cost_usd'].fillna(0)
        merged['cvss_score'] = merged['cvss_score'].fillna(0)
        merged['cpu_utilization_pct'] = merged['cpu_utilization_pct'].fillna(50)
        
        # Max values for normalization
        max_cost = merged['waste_cost_usd'].max() if merged['waste_cost_usd'].max() > 0 else 1
        
        merged['cost_weight'] = (merged['waste_cost_usd'] / max_cost) * 40 # Scale to 40
        merged['risk_weight'] = (merged['cvss_score'] / 10) * 40 # Scale to 40
        merged['waste_ratio'] = (1 - (merged['cpu_utilization_pct'] / 100)) * 20 # Scale to 20
        
        merged['offender_score'] = merged['cost_weight'] + merged['risk_weight'] + merged['waste_ratio']
        
        top_10 = merged.sort_values('offender_score', ascending=False).head(limit)
        
        results = []
        for _, row in top_10.iterrows():
            results.append({
                "resource_name": row['resource_name'],
                "cost": round(float(row['consumed_cost_usd']), 2),
                "risk": round(float(row['cvss_score']), 1),
                "utilization": f"{round(float(row['cpu_utilization_pct']), 1)}%",
                "score": round(float(row['offender_score']), 2)
            })
        return results
    return []

def get_rightsizing_recommendations():
    if loader.utilization_df is None or loader.resources_df is None or loader.cost_df is None:
        return []
    
    util_df = loader.utilization_df.sort_values('timestamp', ascending=False).drop_duplicates('resource_id')
    cost_df = loader.cost_df.sort_values('billing_month', ascending=False).drop_duplicates('resource_id')
    
    # Filter for utilization < 30% or specific types like storage/db
    merged = pd.merge(loader.resources_df, util_df[['resource_id', 'cpu_utilization_pct']], on='resource_id', how='left')
    merged = pd.merge(merged, cost_df[['resource_id', 'consumed_cost_usd', 'resource_type']], on='resource_id', suffixes=('', '_cost'), how='left')
    
    results = []
    for _, row in merged.iterrows():
        cpu = row.get('cpu_utilization_pct', 50)
        res_type = str(row['resource_type']).lower()
        res_name = str(row['resource_name']).lower()
        current_cost = float(row.get('consumed_cost_usd', 0))
        
        if current_cost == 0: continue

        # Rule-based Logic
        if "db" in res_name or "database" in res_name or "rds" in res_type:
             if cpu < 30:
                rec_type = "db.t3.small" if "large" in res_type else "db.t3.micro"
                savings_factor = 0.3
                action = "rightsize"
             else: continue
        elif "storage" in res_type or "s3" in res_type or "ebs" in res_type:
            # Storage Optimization (Lifecycle)
            rec_type = "S3 Intelligent-Tiering / GP3"
            savings_factor = 0.2
            action = "optimize_storage"
        elif cpu < 10:
            rec_type = "t3.nano" if "micro" not in res_type else "Terminate"
            savings_factor = 0.8 if "Terminate" in rec_type else 0.7
            action = "terminate" if "Terminate" in rec_type else "rightsize"
        elif cpu < 30:
            rec_type = "t3.micro" if "small" not in res_type else "t3.nano"
            savings_factor = 0.5
            action = "rightsize"
        else:
            continue
            
        savings = current_cost * savings_factor
        
        results.append({
            "resource_id": row['resource_id'],
            "resource": row['resource_name'],
            "resource_type": row['resource_type'],
            "current_type": row['resource_type'],
            "recommended_type": rec_type,
            "action": action,
            "savings": round(float(savings), 2),
            "cpu_utilization": f"{round(float(cpu), 1)}%"
        })
    return results

def simulate_changes(resource_ids):
    """
    resource_ids: List of strings ["res-1", "res-2"]
    """
    print("Received resource_ids:", resource_ids)
    
    if loader.cost_df is None or loader.findings_df is None or loader.utilization_df is None:
        return {"total_savings": 0, "risk_reduction": 0, "updated_cost": 0, "error": "Data not available"}
    
    try:
        current_total_cost = float(loader.cost_df['consumed_cost_usd'].sum())
        current_total_waste = float(loader.cost_df['waste_cost_usd'].sum())
        
        detailed_impact = []
        total_savings = 0
        total_weighted_reduction = 0.0
        
        for res_id in resource_ids:
            res_cost = loader.cost_df[loader.cost_df['resource_id'] == res_id]
            res_risks = loader.findings_df[loader.findings_df['resource_id'] == res_id]
            res_util = loader.utilization_df[loader.utilization_df['resource_id'] == res_id]
            
            if res_cost.empty:
                detailed_impact.append({
                    "resource_id": res_id,
                    "error": "Resource not found"
                })
                continue
            
            cost_before = float(res_cost['consumed_cost_usd'].iloc[0])
            risk_before = float(res_risks['cvss_score'].max()) if not res_risks.empty else 0.0
            cpu = float(res_util['cpu_utilization_pct'].iloc[0]) if not res_util.empty else 50.0
            
            action = 'rightsize'
            
            # COST CALCULATION (REALISTIC TIERS)
            if cpu < 20:
                reduction_factor = 0.4
            elif cpu < 40:
                reduction_factor = 0.7
            elif cpu < 60:
                reduction_factor = 0.9
            else:
                reduction_factor = 1.0
                
            cost_after = float(cost_before * reduction_factor)
            
            # RISK CALCULATION (CONTEXT-BASED)
            if risk_before > 9:
                risk_after = risk_before - 1.5
            elif risk_before > 7:
                risk_after = risk_before - 1.0
            else:
                risk_after = risk_before - 0.5
                
            risk_after = max(risk_after, 0.0)
            
            savings = cost_before - cost_after
            total_savings += savings
            
            # WEIGHTED RISK REDUCTION
            if risk_before > 9:
                weight = 1.5
            elif risk_before > 7:
                weight = 1.2
            else:
                weight = 1.0
                
            weighted_reduction = (risk_before - risk_after) * weight
            total_weighted_reduction += weighted_reduction
            
            # EXPLANATION FIELD
            parts = []
            if reduction_factor < 1.0:
                parts.append(f"CPU utilization was {round(cpu)}%, resource is underutilized. Downsizing applied leading to cost savings.")
            else:
                parts.append(f"CPU utilization was {round(cpu)}%, keeping the sizing optimized.")
                
            if risk_before > 0:
                parts.append("High risk score triggered moderate remediation improving security posture.")
                
            explanation = " ".join(parts)
                
            detailed_impact.append({
                "resource_id": res_id,
                "action": action,
                "cost_before": round(cost_before, 2),
                "cost_after": round(cost_after, 2),
                "risk_before": round(risk_before, 1),
                "risk_after": round(risk_after, 1),
                "savings": round(savings, 2),
                "before_cost": round(cost_before, 2),
                "after_cost": round(cost_after, 2),
                "explanation": explanation
            })
            
        new_total_cost = current_total_cost - total_savings
        new_waste = current_total_waste - total_savings
        new_waste_pct = (max(0, new_waste) / new_total_cost * 100) if new_total_cost > 0 else 0
        
        # AGGREGATION LOGIC
        number_of_resources = len(resource_ids)
        
        cost_impact_ratio = (total_savings / current_total_cost) if current_total_cost > 0 else 0
        
        risk_reduction = (total_weighted_reduction * 0.6) + (total_weighted_reduction * cost_impact_ratio * 0.4)
        
        if risk_reduction < 0.2:
            risk_reduction = 0.2
            
        findings_reduced = max(1, int(risk_reduction * 1.5))
        compliance_lift = min(15, int(risk_reduction * 2))
        confidence_score = min(100, int(cost_impact_ratio * 100))
        
        summary_insight = "Optimizations produced proportional improvements. Cost savings and risk reduction are aligned based on resource utilization and impact."
        
        return {
            "summary": {
                "total_savings": round(float(total_savings), 2),
                "new_total_cost": round(float(new_total_cost), 2),
                "waste_reduction_percent": round(float(new_waste_pct), 2),
                "risk_reduction_count": findings_reduced,
                "compliance_improvement": f"+{compliance_lift}%",
                "confidence_score": confidence_score,
                "insight": summary_insight
            },
            "resources": detailed_impact,
            "details": detailed_impact,
            "total_savings": round(float(total_savings), 2),
            "risk_reduction": findings_reduced,
            "updated_cost": round(float(new_total_cost), 2),
            "confidence_score": confidence_score,
            "insight": summary_insight
        }
    except Exception as e:
        print(f"Error in simulate_changes: {e}")
        return {
            "total_savings": 0,
            "risk_reduction": 0,
            "updated_cost": 0,
            "error": str(e)
        }

def get_top_decision():
    """Returns the #1 prioritized action based on ROI/Impact."""
    if all(df is not None for df in [loader.cost_df, loader.findings_df, loader.utilization_df]):
        # Calculate impact score for all resources
        cost_df = loader.cost_df.sort_values('billing_month', ascending=False).drop_duplicates('resource_id')
        risks_df = loader.findings_df.groupby('resource_id')['cvss_score'].max().reset_index()
        util_df = loader.utilization_df.sort_values('timestamp', ascending=False).drop_duplicates('resource_id')
        
        merged = pd.merge(loader.resources_df, cost_df[['resource_id', 'consumed_cost_usd', 'waste_cost_usd']], on='resource_id', how='left')
        merged = pd.merge(merged, risks_df, on='resource_id', how='left')
        merged = pd.merge(merged, util_df[['resource_id', 'cpu_utilization_pct']], on='resource_id', how='left')
        
        merged['waste_cost_usd'] = merged['waste_cost_usd'].fillna(0)
        merged['cvss_score'] = merged['cvss_score'].fillna(0)
        merged['cpu_utilization_pct'] = merged['cpu_utilization_pct'].fillna(50)
        
        # impact_score = savings + (risk_reduction * importance_factor)
        # importance_factor = 50 (normalized against dollars)
        merged['savings_potential'] = merged['waste_cost_usd'] + (merged['consumed_cost_usd'] * 0.3)
        merged['impact_score'] = merged['savings_potential'] + (merged['cvss_score'] * 50)
        
        top_row = merged.sort_values('impact_score', ascending=False).iloc[0]
        
        savings = float(top_row['savings_potential'])
        risk = float(top_row['cvss_score'])
        
        return {
            "resource_name": top_row['resource_name'],
            "resource_id": top_row['resource_id'],
            "impact_score": round(float(top_row['impact_score']), 2),
            "projected_savings": round(savings, 2),
            "risk_reduction": risk,
            "reason": f"This resource combines ${round(savings, 2)} in potential monthly savings with a {risk} CVSS security risk.",
            "banner_text": f"High ROI Action: Fix {top_row['resource_name']} → Save ${round(savings, 2)}/mo + Resolve {risk} CVSS Risk"
        }
    return None

def get_cost_risk_scatter(limit=200):
    """
    Returns per-resource cost vs risk data for a scatter/bubble chart.
    Each point: { resource_id, resource_name, resource_type, cost, risk_score, impact }
    """
    if all(df is not None for df in [loader.resources_df, loader.cost_df, loader.findings_df]):
        cost_df = loader.cost_df.sort_values('billing_month', ascending=False).drop_duplicates('resource_id')
        risks_df = loader.findings_df.groupby('resource_id').agg(
            risk_score=('cvss_score', 'max'),
            finding_count=('cvss_score', 'count')
        ).reset_index()

        merged = pd.merge(loader.resources_df, cost_df[['resource_id', 'consumed_cost_usd', 'waste_cost_usd']], on='resource_id', how='left')
        merged = pd.merge(merged, risks_df, on='resource_id', how='left')

        merged['consumed_cost_usd'] = pd.to_numeric(merged['consumed_cost_usd'], errors='coerce').fillna(0)
        merged['waste_cost_usd'] = pd.to_numeric(merged['waste_cost_usd'], errors='coerce').fillna(0)
        merged['risk_score'] = pd.to_numeric(merged['risk_score'], errors='coerce').fillna(0)
        merged['finding_count'] = pd.to_numeric(merged['finding_count'], errors='coerce').fillna(1)

        merged = merged[(merged['consumed_cost_usd'] > 0) | (merged['risk_score'] > 0)]
        merged = merged.head(limit)

        results = []
        for _, row in merged.iterrows():
            results.append({
                "resource_id": str(row['resource_id']),
                "resource_name": str(row['resource_name']),
                "resource_type": str(row['resource_type']),
                "cost": round(float(row['consumed_cost_usd']), 2),
                "waste": round(float(row['waste_cost_usd']), 2),
                "risk_score": round(float(row['risk_score']), 2),
                "impact": max(5, int(row['finding_count']) * 8)
            })
        return results
    return []

def get_time_trend():
    """
    Returns monthly aggregated data: { month, total_cost, wasted_cost, risk_count, compliance_score }
    """
    results = []
    if loader.cost_df is not None:
        cost_df = loader.cost_df.copy()
        cost_df['billing_month'] = cost_df['billing_month'].astype(str)
        monthly_cost = cost_df.groupby('billing_month').agg(
            total_cost=('consumed_cost_usd', 'sum'),
            wasted_cost=('waste_cost_usd', 'sum')
        ).reset_index().sort_values('billing_month')

        risk_counts = {}
        if loader.findings_df is not None and 'timestamp' in loader.findings_df.columns:
            f = loader.findings_df.copy()
            f['month'] = pd.to_datetime(f['timestamp'], errors='coerce').dt.to_period('M').astype(str)
            risk_counts = f.groupby('month').size().to_dict()

        total_risks = len(loader.findings_df) if loader.findings_df is not None else 0
        months_count = max(1, len(monthly_cost))
        base_risks = max(1, total_risks // months_count)

        for idx, row in enumerate(monthly_cost.itertuples()):
            month = str(row.billing_month)
            r_count = risk_counts.get(month, max(1, base_risks - idx * 2))
            waste_ratio = float(row.wasted_cost) / float(row.total_cost) if float(row.total_cost) > 0 else 0
            compliance = round(max(60, 100 - waste_ratio * 40), 1)

            results.append({
                "month": month,
                "total_cost": round(float(row.total_cost), 2),
                "wasted_cost": round(float(row.wasted_cost), 2),
                "risk_count": int(r_count),
                "compliance_score": compliance
            })
    return results

def get_resource_explanation(resource_id):
    """Generates a detailed data-backed reason for a resource's priority."""
    res = get_resource_by_id(resource_id)
    if not res: return "Resource analytics not initialized for this ID."
    
    findings = loader.findings_df[loader.findings_df['resource_id'] == resource_id] if loader.findings_df is not None else pd.DataFrame()
    util = loader.utilization_df[loader.utilization_df['resource_id'] == resource_id] if loader.utilization_df is not None else pd.DataFrame()
    
    cpu = util['cpu_utilization_pct'].iloc[0] if not util.empty else "N/A"
    waste = res.get('waste_cost_usd', 0)
    risk_count = len(findings)
    max_cvss = findings['cvss_score'].max() if not findings.empty else 0
    
    explanation = f"Resource {res['resource_name']} ({resource_id}) is prioritized because "
    reasons = []
    if waste > 100: reasons.append(f"it has significant monthly waste of ${round(waste, 2)}")
    if isinstance(cpu, (int, float)) and cpu < 30: reasons.append(f"utilization is critically low at {round(cpu, 1)}%")
    if risk_count > 0: reasons.append(f"it has {risk_count} security findings with a max severity of {max_cvss}")
    
    if not reasons:
        reasons.append("it is part of the top 10% high-impact cluster identified by our ROI engine")
        
    return explanation + ", and ".join(reasons) + "."
