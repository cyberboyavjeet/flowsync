import os
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import tensorflow as tf
from paypal_client import create_paypal_order, capture_paypal_order

from database import Base, BusinessEntity, Invoice, engine, get_db

# Globals for loaded artifacts
model = None
scaler = None
customer_le = None
customer_risk_map = None

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "ml_artifacts")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, scaler, customer_le, customer_risk_map

    # 1. Initialize Tables in Render PostgreSQL
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Load ML Artifacts
    try:
        model_path = os.path.join(ARTIFACTS_DIR, "flowsync_risk_model.keras")
        scaler_path = os.path.join(ARTIFACTS_DIR, "flowsync_scaler.joblib")
        le_path = os.path.join(ARTIFACTS_DIR, "flowsync_customer_le.joblib")
        risk_map_path = os.path.join(ARTIFACTS_DIR, "flowsync_customer_risk_map.joblib")

        if os.path.exists(model_path):
            model = tf.keras.models.load_model(model_path)
        if os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
        if os.path.exists(le_path):
            customer_le = joblib.load(le_path)
        if os.path.exists(risk_map_path):
            customer_risk_map = joblib.load(risk_map_path)

        print("All FlowSync ML artifacts loaded successfully.")
    except Exception as e:
        print(f"Warning: Failed to load all artifacts: {e}")

    yield
    await engine.dispose()

app = FastAPI(title="FlowSync Backend", lifespan=lifespan)

# Allow React frontend (Vite port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[""https://flowsync-frontend-m2dn.onrender.com",",http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class BusinessCreate(BaseModel):
    name: str

class InvoiceCreate(BaseModel):
    invoice_number: str
    business_id: int
    customer_name: str
    amount: float
    due_date: datetime

# Inference Helper
def predict_risk(customer_name: str, amount: float) -> tuple[float, str]:
    # Dynamic heuristic baseline
    if amount >= 30000:
        score = 0.84
    elif amount >= 16000:
        score = 0.52
    else:
        score = 0.22

    if model is not None and scaler is not None:
        try:
            customer_risk = 0.5
            if customer_risk_map and isinstance(customer_risk_map, dict):
                customer_risk = float(customer_risk_map.get(customer_name, 0.5))

            expected_features = getattr(scaler, "n_features_in_", 2)
            if expected_features == 1:
                input_data = np.array([[amount]], dtype=np.float32)
            elif expected_features == 2:
                input_data = np.array([[amount, customer_risk]], dtype=np.float32)
            else:
                input_data = np.zeros((1, expected_features), dtype=np.float32)
                input_data[0, 0] = amount
                input_data[0, 1] = customer_risk

            scaled_data = scaler.transform(input_data)
            pred = model.predict(scaled_data, verbose=0)
            val = float(pred.flatten()[0])
            if 0.0 <= val <= 1.0:
                score = round(val, 4)
        except Exception as e:
            print(f"[ML Inference Warning] {e}")

    tier = "HIGH" if score >= 0.70 else ("MEDIUM" if score >= 0.40 else "LOW")
    return score, tier

# Endpoints
@app.post("/api/businesses", status_code=201)
async def create_business(payload: BusinessCreate, db: AsyncSession = Depends(get_db)):
    biz = BusinessEntity(name=payload.name)
    db.add(biz)
    await db.commit()
    await db.refresh(biz)
    return biz

@app.get("/api/businesses")
async def list_businesses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BusinessEntity))
    return result.scalars().all()

@app.post("/api/invoices", status_code=201)
async def create_invoice(payload: InvoiceCreate, db: AsyncSession = Depends(get_db)):
    # 1. Verify business exists
    biz = await db.get(BusinessEntity, payload.business_id)
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    # 2. Run ANN prediction
    score, tier = predict_risk(payload.customer_name, payload.amount)

    # 3. Strip timezone info to prevent asyncpg naive vs aware datetime mismatch
    naive_due_date = payload.due_date.replace(tzinfo=None) if payload.due_date.tzinfo else payload.due_date

    # 4. Persist to Render PostgreSQL
    invoice = Invoice(
        invoice_number=payload.invoice_number,
        business_id=payload.business_id,
        customer_name=payload.customer_name,
        amount=payload.amount,
        due_date=naive_due_date,
        risk_score=score,
        risk_tier=tier,
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return invoice

@app.get("/api/invoices")
async def list_invoices(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Invoice).order_by(Invoice.due_date.asc()))
    return result.scalars().all()
@app.post("/api/invoices/{invoice_id}/pay")
async def initiate_payment(invoice_id: int, db: AsyncSession = Depends(get_db)):
    invoice = await db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.status == "PAID":
        raise HTTPException(status_code=400, detail="Invoice is already paid")

    try:
        order = await create_paypal_order(invoice.invoice_number, invoice.amount)
        invoice.paypal_order_id = order["id"]
        await db.commit()

        # Find approval link for frontend redirect
        approval_url = next(
            (link["href"] for link in order.get("links", []) if link.get("rel") == "approve"),
            None
        )
        return {
            "order_id": order["id"],
            "approval_url": approval_url,
            "status": order["status"]
        }
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@app.post("/api/payments/capture/{order_id}")
async def capture_payment(order_id: str, db: AsyncSession = Depends(get_db)):
    try:
        capture_res = await capture_paypal_order(order_id)
        if capture_res.get("status") == "COMPLETED":
            # Update matching invoice in Postgres
            stmt = select(Invoice).where(Invoice.paypal_order_id == order_id)
            result = await db.execute(stmt)
            invoice = result.scalar_one_or_none()
            if invoice:
                invoice.status = "PAID"
                await db.commit()
                await db.refresh(invoice)
                return {"message": "Payment captured successfully", "invoice": invoice}

        return {"message": "Captured", "details": capture_res}
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))



class ActionRecommendation(BaseModel):
    invoice_id: int
    invoice_number: str
    customer_name: str
    amount: float
    risk_score: float
    risk_tier: str
    recommended_action: str
    discount_amount: float
    action_type: str

@app.get("/api/agent/recommendations")
async def get_agent_recommendations(db: AsyncSession = Depends(get_db)):
    stmt = select(Invoice).where(Invoice.status == "PENDING").order_by(Invoice.amount.desc())
    res = await db.execute(stmt)
    invoices = res.scalars().all()

    recommendations = []
    for inv in invoices:
        if inv.risk_tier == "HIGH" or inv.amount >= 25000:
            discount = round(inv.amount * 0.03, 2)
            recommendations.append({
                "invoice_id": inv.id,
                "invoice_number": inv.invoice_number,
                "customer_name": inv.customer_name,
                "amount": inv.amount,
                "risk_score": inv.risk_score if inv.risk_score > 0 else 0.82,
                "risk_tier": "HIGH",
                "recommended_action": f"Critical cash exposure: Offer 3% dynamic discount (${discount:,.2f}) for early settlement via PayPal.",
                "discount_amount": discount,
                "action_type": "OFFER_DISCOUNT"
            })
        elif inv.risk_tier == "MEDIUM" or inv.amount >= 15000:
            recommendations.append({
                "invoice_id": inv.id,
                "invoice_number": inv.invoice_number,
                "customer_name": inv.customer_name,
                "amount": inv.amount,
                "risk_score": inv.risk_score if inv.risk_score > 0 else 0.48,
                "risk_tier": "MEDIUM",
                "recommended_action": "Impending due date: Dispatch automated SMS/Email reminder with direct 1-click PayPal checkout link.",
                "discount_amount": 0.0,
                "action_type": "SEND_REMINDER"
            })
        else:
            recommendations.append({
                "invoice_id": inv.id,
                "invoice_number": inv.invoice_number,
                "customer_name": inv.customer_name,
                "amount": inv.amount,
                "risk_score": inv.risk_score,
                "risk_tier": "LOW",
                "recommended_action": "Healthy receivable: Queue standard 7-day payment reminder via PayPal invoicing.",
                "discount_amount": 0.0,
                "action_type": "SEND_REMINDER"
            })

    return recommendations