import pandas as pd
import os

# Global variables for dataframes
resources_df = None
utilization_df = None
security_df = None
findings_df = None
cost_df = None
compliance_df = None
alerts_df = None
audit_df = None

def load_datasets():
    global resources_df, utilization_df, security_df, findings_df
    global cost_df, compliance_df, alerts_df, audit_df
    
    # Base path relative to main.py
    base_path = "cloud_security_dataset"
    
    print("Loading datasets...")
    try:
        resources_df = pd.read_csv(os.path.join(base_path, "1_cloud_resources_inventory.csv"))
        utilization_df = pd.read_csv(os.path.join(base_path, "2_resource_utilization_metrics.csv"))
        security_df = pd.read_csv(os.path.join(base_path, "3_security_configuration_snapshot.csv"))
        findings_df = pd.read_csv(os.path.join(base_path, "4_risk_severity_findings.csv"))
        cost_df = pd.read_csv(os.path.join(base_path, "5_cost_billing_simulation.csv"))
        compliance_df = pd.read_csv(os.path.join(base_path, "6_compliance_framework_mapping.csv"))
        alerts_df = pd.read_csv(os.path.join(base_path, "7_incident_alert_history.csv"))
        audit_df = pd.read_csv(os.path.join(base_path, "8_user_access_audit_log.csv"))
        print("All datasets loaded successfully.")
    except Exception as e:
        print(f"Error loading datasets: {e}")
