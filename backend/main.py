from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import Base, engine, get_db, BusinessEntity, Invoice

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically creates 'businesses' and 'invoices' tables in Render Postgres
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(title="FlowSync Backend", lifespan=lifespan)

# Allow React frontend (Vite runs on port 5173 by default)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schemas
class BusinessCreate(BaseModel):
    name: str

class InvoiceCreate(BaseModel):
    invoice_number: str
    business_id: int
    amount: float
    due_date: datetime

# Routes
@app.post("/api/businesses", status_code=201)
async def create_business(payload: BusinessCreate, db: AsyncSession = Depends(get_db)):
    biz = BusinessEntity(name=payload.name)
    db.add(biz)
    await db.commit()
    await db.refresh(biz)
    return biz

@app.get("/api/businesses")
async def get_businesses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BusinessEntity))
    return result.scalars().all()

@app.post("/api/invoices", status_code=201)
async def create_invoice(payload: InvoiceCreate, db: AsyncSession = Depends(get_db)):
    # Connect your TensorFlow/ANN inference logic from ml_artifacts here
    # Example placeholder:
    predicted_score = 0.74
    predicted_tier = "HIGH" if predicted_score > 0.7 else "LOW"

    invoice = Invoice(
        invoice_number=payload.invoice_number,
        business_id=payload.business_id,
        amount=payload.amount,
        due_date=payload.due_date,
        risk_score=predicted_score,
        risk_tier=predicted_tier,
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return invoice

@app.get("/api/invoices")
async def get_invoices(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Invoice).order_by(Invoice.due_date.asc()))
    return result.scalars().all()