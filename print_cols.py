import pandas as pd
print("Util:", list(pd.read_csv('cloud_security_dataset/2_resource_utilization_metrics.csv').columns))
print("Cost:", list(pd.read_csv('cloud_security_dataset/5_cost_billing_simulation.csv').columns))
