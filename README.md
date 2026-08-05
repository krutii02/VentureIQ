# 🚀 VentureIQ — AI-Powered Startup Intelligence & Investor Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.0%2B-092E20?logo=django&logoColor=white)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-ML%20Engine-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org)

**VentureIQ** is an end-to-end, data-driven platform engineered to bridge early-stage startups with venture capital investors. Powered by a multi-model **Machine Learning Engine**, VentureIQ provides automated valuation, 12-month revenue forecasting, customer growth trajectories, risk classification, and thesis-driven investor matching.

---

## ✨ Key Features

### 🏢 For Founders
* **ML Startup Assessment & Valuation:** Instant predictive scoring across innovation, risk level, market trend, and investor attractiveness.
* **AI Video & Document Intelligence:** Generate promotional AI video pitch outlines, SWOT analysis, and auto-generated investor reports.
* **Smart Investor Matching:** Algorithmic match scoring based on VC sector preferences, ticket sizes, and investment stage.
* **Meeting & Deal Flow Management:** Direct meeting request system with integrated messaging threads to communicate with interested investors.

### 💼 For VC & Angel Investors
* **Deal Discovery & Filtering:** Search and filter curated startups by industry, stage, revenue growth, team size, and risk rating.
* **Side-by-Side Startup Comparison:** Compare metrics, financial health, tech stacks, and predictive AI scores across multiple startups.
* **Watchlist & Analytics:** Track target investments, export document reports, and monitor real-time portfolio performance metrics.
* **Direct Outreach:** Initiate contact with founders, send meeting requests, and manage active deal negotiations.

### 🛡️ For Administrators
* **User & Profile Management:** Role-based access control (RBAC) supporting `FOUNDER`, `INVESTOR`, and `ADMIN`.
* **Platform Approvals & Verification:** Verify investor funds and startup registrations to ensure platform security and data integrity.

---

## 🧠 Machine Learning Suite

VentureIQ integrates **5 scikit-learn models** trained on quantitative venture metrics:

| Model | Algorithm | Output / Purpose |
| :--- | :--- | :--- |
| **Revenue Predictor** | Linear Regression | 12-Month Future Revenue Trajectory |
| **Growth Forecaster** | Polynomial Regression (Degree 2) | Non-linear Customer Growth Curve |
| **Risk Classifier** | Decision Tree Classifier | Risk Categorization (`Low`, `Medium`, `High`) |
| **Success Score Engine** | K-Nearest Neighbors (KNN) | Startup Success Probability (`0 - 100%`) |
| **Investor Interest Model**| Random Forest Classifier | Investor Attractiveness Score (`0 - 100%`) |

---

## 🛠️ Tech Stack

### Backend
* **Framework:** Django 5.x / Django REST Framework (DRF)
* **Database:** SQLite (Development) / PostgreSQL-ready
* **ML Libraries:** `scikit-learn`, `pandas`, `numpy`
* **API Architecture:** RESTful APIs with JSON serialization

### Frontend
* **Core:** React 19, Vite, JavaScript (ESNext)
* **Routing:** React Router v7
* **Data Visualization:** Recharts
* **UI & Animations:** Framer Motion, Lucide Icons, Heroicons, React Hot Toast
* **HTTP Client:** Axios

---

## 📁 Repository Structure

```
VentureIQ/
├── backend/                  # Django REST API Backend
│   ├── api/                  # Core App (Models, Views, Serializers, ML Engine)
│   │   ├── ml_engine.py      # ML Suite (Linear, Poly, Decision Tree, KNN, Random Forest)
│   │   ├── models.py         # DB Schemas (User, Startup, Investor, Watchlist, Meetings)
│   │   ├── views.py          # REST Endpoints & Business Logic
│   │   └── urls.py           # API Route Registry
│   ├── backend/              # Django Project Settings
│   ├── dataset/              # Cleaned venture dataset CSVs
│   ├── db.sqlite3            # Database file
│   └── manage.py             # Django CLI
├── frontend/                 # React + Vite Single Page Application
│   ├── src/
│   │   ├── components/       # Reusable UI components (Navbar, Modals, Cards)
│   │   ├── context/          # React Context (Auth, Global State)
│   │   ├── pages/            # Page Views (Founder, Investor, Admin, Public)
│   │   ├── services/         # API Service Integrations (Axios)
│   │   └── routes/           # Protected & Role-Based Routing
│   ├── package.json          # Frontend dependencies
│   └── vite.config.js        # Vite Build Configuration
└── README.md                 # Project Documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Python**: `3.10` or higher
* **Node.js**: `18.x` or higher
* **Git**

---

### 1. Backend Setup (Django API & ML Engine)

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment:**
   * **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * **macOS/Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install backend dependencies:**
   ```bash
   pip install django djangorestframework django-cors-headers scikit-learn pandas numpy
   ```

4. **Apply Database Migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Start the Django Development Server:**
   ```bash
   python manage.py runserver
   ```
   The backend API will run at `http://127.0.0.1:8000/`.

---

### 2. Frontend Setup (React + Vite)

1. **Navigate to the frontend folder:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Launch the development server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173/`.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/login/` | User authentication & token issuance | Public |
| `POST` | `/api/register/` | Account creation (`Founder` / `Investor`) | Public |
| `GET` / `POST` | `/api/startups/` | List or create startup entries | Authenticated |
| `GET` | `/api/startups/<id>/` | Fetch startup details & ML predictions | Authenticated |
| `POST` | `/api/ml/predict/` | Run 5 ML model evaluations on startup data | Founder / Admin |
| `GET` / `POST` | `/api/watchlist/` | Manage investor saved watchlist | Investor |
| `GET` / `POST` | `/api/meetings/` | Send & respond to founder-investor pitch meetings | Authenticated |
| `GET` / `POST` | `/api/investors/` | List/Filter verified VC firms & Angels | Authenticated |

---

## 🤝 Contributing

Contributions are welcome! If you find any issues or have feature requests:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

<p align="center">
  Made with ❤️ for Founders & Investors.
</p>
