import asyncio
import os
import ssl
from urllib.parse import urlsplit, urlunsplit
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv()

raw_url = os.getenv("DATABASE_URL", "").strip()

if not raw_url:
    raise ValueError("DATABASE_URL is not set in your .env file.")

# 1. Normalize scheme for asyncpg
if raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgresql://"):
    raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# 2. Strip query parameters (like ?sslmode=require) so asyncpg doesn't reject them
parsed = urlsplit(raw_url)
clean_url = urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))

# 3. Create SSL context required for Render's external connections
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

async def test_connection():
    print("Connecting to Render PostgreSQL...")
    engine = create_async_engine(
        clean_url,
        connect_args={"ssl": ssl_context},
        echo=False,
    )
    
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT version();"))
        print("\nConnection Successful!")
        print("Database Version:", result.scalar())
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_connection())