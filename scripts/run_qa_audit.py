import os
import sys
import json
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5173"
API_URL = "http://127.0.0.1:8000"

def run_qa_audit():
    print("=== STARTING RIGOROUS QA AUDIT ===")
    results = {
        "routes_checked": [],
        "console_errors": [],
        "failed_requests": [],
        "responsive_checks": {},
        "interactions_tested": [],
        "bugs_found": []
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Listen for console errors & failed requests
        def on_console(msg):
            if msg.type in ["error"]:
                text = msg.text
                print(f"[BROWSER CONSOLE ERROR] {text}")
                results["console_errors"].append(text)

        def on_request_failed(request):
            print(f"[FAILED NETWORK REQUEST] {request.method} {request.url} - {request.failure}")
            results["failed_requests"].append(f"{request.method} {request.url}: {request.failure}")

        page.on("console", on_console)
        page.on("requestfailed", on_request_failed)

        routes = [
            ("/", "Executive Overview"),
            ("/cases", "Acquisition Case Registry"),
            ("/risk-analytics", "Predictive Delay Analytics"),
            ("/map", "Geographic Infrastructure Map"),
            ("/actions", "Administrative Action Center"),
            ("/data", "Data Management & Ingestion"),
            ("/model", "Predictive Model Evaluation"),
            ("/settings", "System Configuration"),
        ]

        # 1. Test all 8 primary routes
        for path, name in routes:
            url = f"{BASE_URL}{path}"
            print(f"\n--- Testing Route: {path} ({name}) ---")
            page.goto(url, wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(1000)
            title = page.title()
            content = page.content()
            results["routes_checked"].append({"path": path, "title": title, "status": "loaded"})
            print(f"Loaded {path} successfully. Page title: '{title}'")

        # 2. Test Case Detail Navigation & Interactions
        print("\n--- Testing Case Registry & Detail Navigation ---")
        page.goto(f"{BASE_URL}/cases", wait_until="networkidle")
        page.wait_for_timeout(1000)

        # Click first row
        first_row = page.locator("tbody tr").first
        if first_row.is_visible():
            first_case_id = first_row.locator("td").first.inner_text().strip()
            print(f"Clicking first case row: {first_case_id}")
            first_row.click()
            page.wait_for_timeout(1500)
            print(f"Current URL after click: {page.url}")
            results["interactions_tested"].append(f"Navigated to Case Detail: {page.url}")

            # Check if Case Overview, Milestones, and Risk Evaluation rendered
            has_milestones = page.locator("text=Statutory Milestone Progression Timeline").is_visible()
            has_risk = page.locator("text=Risk Evaluation").is_visible()
            print(f"Case Detail verification - Milestones: {has_milestones}, Risk: {has_risk}")

            # Test Update Parameters Modal
            update_btn = page.locator("button:has-text('Update Parameters')")
            if update_btn.is_visible():
                update_btn.click()
                page.wait_for_timeout(500)
                modal_visible = page.locator("text=Update Parcel Monitoring Records").is_visible()
                print(f"Update Modal visible: {modal_visible}")
                page.locator("button:has-text('Cancel')").click()
                page.wait_for_timeout(300)

        # 3. Test Action Center: Create directive & toggle status
        print("\n--- Testing Action Center Workflow ---")
        page.goto(f"{BASE_URL}/actions", wait_until="networkidle")
        page.wait_for_timeout(1000)
        toggle_btn = page.locator("button:has-text('Toggle')").first
        if toggle_btn.is_visible():
            init_text = toggle_btn.inner_text()
            print(f"Toggling first action status from: {init_text}")
            toggle_btn.click()
            page.wait_for_timeout(1000)
            new_text = page.locator("button:has-text('Toggle')").first.inner_text()
            print(f"Action status updated to: {new_text}")
            results["interactions_tested"].append(f"Action status toggle from '{init_text}' to '{new_text}'")

        # 4. Test Model Evaluation: Prediction Sandbox
        print("\n--- Testing Model Evaluation Prediction Sandbox ---")
        page.goto(f"{BASE_URL}/model", wait_until="networkidle")
        page.wait_for_timeout(1000)
        predict_btn = page.locator("button:has-text('Compute Delay Probability')")
        if predict_btn.is_visible():
            predict_btn.click()
            page.wait_for_timeout(1500)
            prob_box = page.locator("text=Predicted Delay Probability:").is_visible()
            print(f"ML Delay Prediction Sandbox output displayed: {prob_box}")
            results["interactions_tested"].append(f"ML Sandbox inference output visible: {prob_box}")

        # 5. Test Risk Analytics Simulator
        print("\n--- Testing Risk Analytics Simulator ---")
        page.goto(f"{BASE_URL}/risk-analytics", wait_until="networkidle")
        page.wait_for_timeout(1000)
        sim_heading = page.locator("text=Interactive Transparent Risk Engine Simulator").is_visible()
        print(f"Simulator visible: {sim_heading}")

        # 6. Test Responsive Viewports (390px, 768px, 1440px)
        viewports = [
            ("mobile_390px", 390, 844),
            ("tablet_768px", 768, 1024),
            ("desktop_1440px", 1440, 900)
        ]
        for vp_name, w, h in viewports:
            print(f"\n--- Checking Viewport: {vp_name} ({w}x{h}) ---")
            page.set_viewport_size({"width": w, "height": h})
            page.goto(f"{BASE_URL}/", wait_until="networkidle")
            page.wait_for_timeout(1000)
            # Check horizontal overflow
            scroll_width = page.evaluate("document.documentElement.scrollWidth")
            client_width = page.evaluate("document.documentElement.clientWidth")
            overflow = scroll_width > client_width
            results["responsive_checks"][vp_name] = {
                "scrollWidth": scroll_width,
                "clientWidth": client_width,
                "hasHorizontalOverflow": overflow
            }
            print(f"Viewport {vp_name}: scrollWidth={scroll_width}, clientWidth={client_width}, overflow={overflow}")

        browser.close()

    print("\n=== QA AUDIT COMPLETE ===")
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    run_qa_audit()
