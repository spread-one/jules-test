import requests
import time

BASE_URL = "http://localhost:3000"

def main():
    try:
        # 1. Sign up a new user
        unique_id = int(time.time())
        signup_payload = {
            "name": f"debug_user_{unique_id}",
            "userId": f"debug_user_{unique_id}",
            "password": "password123"
        }
        print(f"--- Signing up user: {signup_payload['userId']} ---")
        signup_res = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_payload)
        signup_res.raise_for_status()
        print("Signup successful.")

        # 2. Log in to get a token
        print("\n--- Logging in ---")
        login_payload = {
            "userId": signup_payload['userId'],
            "password": "password123"
        }
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        login_res.raise_for_status()
        token = login_res.json()['token']
        print(f"Login successful. Token: {token}")

        headers = {"Authorization": f"Bearer {token}"}

        # 3. Create a post with that token
        print("\n--- Creating a post ---")
        post_payload = {
            "title": "Test Post from Debug Script",
            "content": "This is to test the API sequence.",
            "boardId": 1
        }
        post_res = requests.post(f"{BASE_URL}/api/posts", headers=headers, json=post_payload)
        post_res.raise_for_status()
        print("Post creation successful.")

        # 4. Immediately try to get user info
        print("\n--- Getting user info (/api/auth/me) ---")
        me_res = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)

        print(f"Status Code: {me_res.status_code}")
        print(f"Response JSON: {me_res.json()}")
        me_res.raise_for_status()
        print("\nSuccessfully fetched user info after post creation.")

    except requests.exceptions.HTTPError as e:
        print(f"\n--- ERROR ---")
        print(f"Request to {e.request.url} failed with status {e.response.status_code}")
        print(f"Response body: {e.response.text}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    main()
