import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_query(question):
    print(f"\n--- Testing Question: {question} ---")
    try:
        response = requests.post(f"{BASE_URL}/ask", json={"question": question})
        if response.status_code == 200:
            data = response.json()
            print(f"Status: {data.get('status')}")
            print(f"Response: {data.get('response')[:200]}...")
            print(f"Insight: {data.get('insight')[:200]}...")
            print(f"Confidence Score: {data.get('confidence_score')}")
            print(f"Estimated Impact: {data.get('estimated_impact')}")
            
            # ROI check in data
            top_issues = data.get('data', {}).get('top_priority_ranked_issues', [])
            if top_issues:
                print(f"ROI Score (Sample): {top_issues[0].get('roi_score')}")
                print(f"Effort (Sample): {top_issues[0].get('implementation_effort')}")
                print(f"Impact (Sample): {top_issues[0].get('impact_estimation')}")
            
            # Validation
            assert "confidence_score" in data, "Missing confidence_score"
            assert "estimated_impact" in data, "Missing estimated_impact"
            print("SUCCESS: New fields present in response.")
            
        else:
            print(f"ERROR: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"CONNECTION ERROR: {str(e)}")

if __name__ == "__main__":
    # Test 1: Mixed Intent (Security + Cost)
    test_query("Which high-risk resource has the best ROI to fix first?")
    
    # Test 2: Cost Intent
    test_query("How can I reduce waste with high confidence?")
