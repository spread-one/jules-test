import time
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    base_url = "http://localhost:3000"

    # --- 1. Create Admin User ---
    print("--- 1. Creating Admin User ---")
    page.goto(f"{base_url}/signup.html")
    page.fill("#signup-name", "adminuser")
    page.fill("#signup-userId", "admin")
    page.fill("#signup-password", "password123")
    page.check("#signup-admin-checkbox")
    expect(page.locator("#admin-passkey-modal")).to_be_visible()
    page.fill("#admin-passkey-input", "12345678")
    page.click("#admin-passkey-submit")

    # Wait for redirection to login page
    expect(page).to_have_url(f"{base_url}/")
    print("Admin user created successfully.")

    # --- 2. Login as Admin and Verify Badge ---
    print("\n--- 2. Logging in as Admin ---")
    page.fill("#login-userId", "admin")
    page.fill("#login-password", "password123")
    page.click("button[type='submit']")

    # Wait for app container to be visible
    expect(page.locator("#app-container")).to_be_visible()

    welcome_message = page.locator("#user-welcome-message")
    expect(welcome_message).to_contain_text("adminuser(admin)님, 환영합니다!")

    admin_badge = welcome_message.locator("span.admin-badge")
    expect(admin_badge).to_be_visible()
    expect(admin_badge).to_have_text("(관리자)")

    page.screenshot(path="jules-scratch/verification/admin_login_and_badge.png")
    print("Admin logged in, badge is visible. Screenshot taken.")

    # --- 3. Create a post as Admin ---
    print("\n--- 3. Admin creating a post ---")
    page.fill("#create-title", "Admin Post Title")
    page.fill("#create-content", "This post was made by an admin.")
    page.click("#create-post-form button[type='submit']")

    # Wait for post to appear
    admin_post = page.locator("li[data-author-id='1']") # Admin should have user id 1
    expect(admin_post).to_be_visible()
    expect(admin_post.locator("h3")).to_have_text("Admin Post Title")
    print("Admin post created.")

    # --- 4. Logout ---
    print("\n--- 4. Logging out admin ---")
    page.click("#logout-button")
    expect(page.locator("#login-form-container")).to_be_visible()
    print("Admin logged out.")

    # --- 5. Create Normal User ---
    print("\n--- 5. Creating Normal User ---")
    page.goto(f"{base_url}/signup.html")
    page.fill("#signup-name", "normaluser")
    page.fill("#signup-userId", "normal")
    page.fill("#signup-password", "password123")
    page.click("button[type='submit']")
    expect(page).to_have_url(f"{base_url}/")
    print("Normal user created successfully.")

    # --- 6. Login as Normal User and check permissions ---
    print("\n--- 6. Logging in as Normal User ---")
    page.fill("#login-userId", "normal")
    page.fill("#login-password", "password123")
    page.click("button[type='submit']")
    expect(page.locator("#app-container")).to_be_visible()

    # Normal user should see the admin's post
    expect(admin_post).to_be_visible()

    # Normal user should NOT see edit/delete buttons on admin's post
    post_actions = admin_post.locator(".post-actions")
    expect(post_actions).not_to_be_visible()
    print("Normal user can see admin post but not the action buttons.")

    page.screenshot(path="jules-scratch/verification/normal_user_view.png")
    print("Screenshot taken of normal user's view.")

    # --- 7. Create a post as Normal User ---
    print("\n--- 7. Normal user creating a post ---")
    page.fill("#create-title", "Normal User Post")
    page.fill("#create-content", "This is a post by a normal user.")
    page.click("#create-post-form button[type='submit']")

    # Wait for post to appear
    normal_post = page.locator("li[data-author-id='2']") # Normal user should have id 2
    expect(normal_post).to_be_visible()
    expect(normal_post.locator("h3")).to_have_text("Normal User Post")
    # The normal user should see actions on their own post
    expect(normal_post.locator(".post-actions")).to_be_visible()
    print("Normal user post created.")

    # --- 8. Logout ---
    print("\n--- 8. Logging out normal user ---")
    page.click("#logout-button")
    expect(page.locator("#login-form-container")).to_be_visible()
    print("Normal user logged out.")

    # --- 9. Login as Admin again to check permissions on other's post ---
    print("\n--- 9. Logging in as Admin again ---")
    page.fill("#login-userId", "admin")
    page.fill("#login-password", "password123")
    page.click("button[type='submit']")
    expect(page.locator("#app-container")).to_be_visible()

    # Admin should see the normal user's post and have action buttons
    expect(normal_post).to_be_visible()
    expect(normal_post.locator(".post-actions")).to_be_visible()
    print("Admin can see action buttons on normal user's post.")

    # --- 10. Admin deletes the normal user's post ---
    print("\n--- 10. Admin deleting normal user's post ---")
    # Need to re-locate the element to avoid stale element error
    page.locator("li[data-author-id='2'] .delete-btn").click()
    # No confirmation dialog in this app, so we just check it's gone
    expect(normal_post).not_to_be_visible()
    print("Admin successfully deleted the normal user's post.")

    page.screenshot(path="jules-scratch/verification/admin_deletes_post.png")
    print("Screenshot taken after admin deleted post.")

    # --- Cleanup ---
    browser.close()

def main():
    with sync_playwright() as p:
        try:
            run_verification(p)
            print("\n✅ Frontend verification script completed successfully!")
        except Exception as e:
            print(f"\n❌ Frontend verification script failed: {e}")
            # Exit with a non-zero code to indicate failure
            exit(1)

if __name__ == "__main__":
    main()
