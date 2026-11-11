# FlowSync — Autonomous SME Cash Flow & Risk Orchestration Engine

FlowSync is an intelligent cash flow forecasting and risk mitigation platform built for small and medium enterprises (SMEs). By combining a deep learning Artificial Neural Network (ANN) default risk engine with autonomous mitigation agents and direct PayPal Sandbox payment workflows, FlowSync turns static invoices into proactive working capital.

---

## Key Features

1. **AI-Driven Default Risk Engine**:
   - Built on TensorFlow/Keras and trained on enterprise B2B invoice data.
   - Evaluates client history and exposure amounts to classify receivables into High, Medium, and Low risk tiers.

2. **Autonomous Action Agent**:
   - Continuously scans active ledgers in PostgreSQL.
   - Recommends dynamic early-settlement discounts (e.g., 3% for immediate 48-hour settlement) and automated payment reminders for high-risk accounts.

3. **Integrated PayPal Sandbox Checkout**:
   - Generates live PayPal Sandbox checkout orders dynamically linked to invoice IDs.
   - Automatically synchronizes payment settlements and updates status to `PAID` upon capture.

4. **Interactive Cash Flow Forecaster**:
   - Visualizes timeline projections and separates secure inflows from at-risk exposure using Recharts.

---

## Tech Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Recharts
- **Backend**: FastAPI (Python 3.11), Uvicorn, Asyncpg, SQLAlchemy 2.0 (Async ORM)
- **Database**: PostgreSQL (Hosted on Render)
- **Machine Learning**: TensorFlow / Keras, Scikit-Learn, Joblib
- **Payment Gateway**: PayPal REST API (v2 Checkout Orders)

---

## Architecture Flow

[React / Vite Dashboard]
│
▼ (REST / JSON)
[FastAPI Backend Engine] ◄──► [TensorFlow ANN Model & Scaler]
│
├──► [Render PostgreSQL (AsyncPG)]
│
└──► [PayPal Sandbox REST API (OAuth2 / Checkout v2)]

---

## Local Setup & Installation

### 1. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate

pip install fastapi uvicorn sqlalchemy asyncpg psycopg2-binary tensorflow scikit-learn joblib httpx python-dotenv pydantic

# Run the backend server
uvicorn main:app --reload

Backend will be live at http://127.0.0.1:8000 with Swagger UI at http://127.0.0.1:8000/docs.

2. Frontend Setup
 cd frontend
 npm install
 npm run dev


### 2-Minute Demo Presentation Script

When recording your demo video or presenting to the judges:

1. **The Problem (0:00 - 0:25)**:
   > *"SMEs fail not because they lack revenue, but because of delayed payments and unpredictable cash flow gaps. Traditional invoicing tools are completely passive—waiting for invoices to become overdue before alerting anyone."*

2. **The Solution & Live Dashboard (0:25 - 0:55)**:
   > *"FlowSync changes this by making cash flow proactive. Here on the dashboard, invoices are loaded asynchronously from Render PostgreSQL and mapped into a live cash flow projection timeline using Recharts."*

3. **Real-Time ML Risk Assessment (0:55 - 1:25)**:
   > *"When a business adds an invoice—like this $45,000 receivable for Apex Enterprise—our backend TensorFlow neural network immediately scores default probability based on client exposure patterns. You can see the timeline immediately flag the red at-risk inflow bar."*

4. **Autonomous Agent & PayPal Integration (1:25 - 1:55)**:
   > *"Instead of leaving this risk unaddressed, the FlowSync Autonomous Action Agent detects the critical exposure and formulates an intervention: offering an automated 3% early-pay discount. Clicking 'Execute Agent Action' calls PayPal's Orders API to instantly generate a secure, discounted Sandbox checkout session."*

5. **Conclusion (1:55 - 2:00)**:
   > *"FlowSync bridges predictive risk modeling with autonomous financial settlement, keeping SME working capital healthy and predictable."*