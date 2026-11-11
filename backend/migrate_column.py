import asyncio
from sqlalchemy import text
from database import engine

async def add_missing_columns():
    async with engine.begin() as conn:
        print("Adding missing columns to invoices table...")
        await conn.execute(text(
            "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_name VARCHAR(120) DEFAULT 'General Customer';"
        ))
        print("Migration complete: 'customer_name' column added successfully!")

if __name__ == "__main__":
    asyncio.run(add_missing_columns())