import os
import ssl
from collections.abc import AsyncGenerator
from datetime import datetime
from urllib.parse import urlsplit, urlunsplit
from dotenv import load_dotenv
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

load_dotenv()

raw_url = os.getenv("DATABASE_URL", "").strip()
if not raw_url:
    raise ValueError("DATABASE_URL is not set in backend/.env")

# Normalize connection string for asyncpg
if raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgresql://"):
    raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)

parsed = urlsplit(raw_url)
clean_url = urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

engine = create_async_engine(
    clean_url,
    connect_args={"ssl": ssl_context},
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

class BusinessEntity(Base):
    __tablename__ = "businesses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    invoices: Mapped[list["Invoice"]] = relationship(
        back_populates="business", cascade="all, delete-orphan"
    )

class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    invoice_number: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), index=True)
    customer_name: Mapped[str] = mapped_column(String(120), default="General Customer")

    amount: Mapped[float] = mapped_column(Float, nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="PENDING")
    paypal_order_id: Mapped[str | None] = mapped_column(String(128), nullable=True)

    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_tier: Mapped[str | None] = mapped_column(String(16), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    business: Mapped["BusinessEntity"] = relationship(back_populates="invoices")