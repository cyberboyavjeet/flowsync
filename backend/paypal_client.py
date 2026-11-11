import os
import base64
import httpx
from dotenv import load_dotenv

load_dotenv()

PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "").strip()
PAYPAL_SECRET = os.getenv("PAYPAL_SECRET", "").strip()
PAYPAL_BASE_URL = "https://api-m.sandbox.paypal.com"

async def get_paypal_access_token() -> str:
    auth_str = f"{PAYPAL_CLIENT_ID}:{PAYPAL_SECRET}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()

    headers = {
        "Authorization": f"Basic {b64_auth}",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    data = {"grant_type": "client_credentials"}

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{PAYPAL_BASE_URL}/v1/oauth2/token",
            headers=headers,
            data=data,
            timeout=15.0,
        )
        if res.status_code != 200:
            raise RuntimeError(f"PayPal Auth Failed: {res.text}")
        return res.json()["access_token"]

async def create_paypal_order(invoice_number: str, amount: float) -> dict:
    token = await get_paypal_access_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": invoice_number,
                "amount": {
                    "currency_code": "USD",
                    "value": f"{amount:.2f}",
                },
                "description": f"FlowSync Invoice Payment - {invoice_number}",
            }
        ],
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{PAYPAL_BASE_URL}/v2/checkout/orders",
            headers=headers,
            json=payload,
            timeout=15.0,
        )
        if res.status_code not in (200, 201):
            raise RuntimeError(f"PayPal Order creation failed: {res.text}")
        return res.json()

async def capture_paypal_order(order_id: str) -> dict:
    token = await get_paypal_access_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{PAYPAL_BASE_URL}/v2/checkout/orders/{order_id}/capture",
            headers=headers,
            timeout=15.0,
        )
        if res.status_code not in (200, 201):
            raise RuntimeError(f"PayPal Capture failed: {res.text}")
        return res.json()
import time

cached_token = None
token_expires_at = 0

async def get_paypal_access_token() -> str:
    global cached_token, token_expires_at

    # Return cached token if valid
    if cached_token and time.time() < token_expires_at - 60:
        return cached_token

    auth_str = f"{PAYPAL_CLIENT_ID}:{PAYPAL_SECRET}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()

    headers = {
        "Authorization": f"Basic {b64_auth}",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    data = {"grant_type": "client_credentials"}

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{PAYPAL_BASE_URL}/v1/oauth2/token",
            headers=headers,
            data=data,
            timeout=15.0,
        )
        if res.status_code != 200:
            raise RuntimeError(f"PayPal Auth Failed: {res.text}")

        json_data = res.json()
        cached_token = json_data["access_token"]
        token_expires_at = time.time() + json_data.get("expires_in", 32400)
        return cached_token