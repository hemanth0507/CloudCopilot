import requests
import json

BASE_URL = "http://localhost:8000"

def test_query(question):
    print(f"\n--- Testing Question: {question} ---")
    try:
        response = requests.post(f"{BASE_URL}/ask", json={"question": question})
        if response.status_code == 200:
            data = response.json()
            print(f"Status: {data.get('status')}")
            print(f"Response: {data.get('response')}")
            print(f"Insight: {data.get('insight')}")
            print(f"Recommendation: {data.get('recommendation')}")
            
            # Validation checks
            res_text = str(data.get('response', '')) + str(data.get('insight', '')) + str(data.get('recommendation', ''))
            greetings = ["initialized", "how can I help", "hello", "hi "]
            for g in greetings:
                if g in res_text.lower():
                    print(f"FAIL: Found greeting '{g}' in response.")
            
        else:
            print(f"ERROR: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"CONNECTION ERROR: {str(e)}")

if __name__ == "__main__":
    # Test 1: Security Intent
    test_query("Which specific critical risk should I fix first?")
    
    # Test 2: Cost Intent
    test_query("Why is my cloud cost high?")
    
    # Test 3: Formatting and Greeting check
    test_query("Summarize my account status.")
