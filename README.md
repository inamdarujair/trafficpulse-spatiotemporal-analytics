# TrafficPulse: Dynamic Spatio-Temporal Traffic Analytics Using PySpark and MongoDB Atlas

An end-to-end Big Data Analytics and visualization platform designed for high-throughput metropolitan traffic pattern extraction, dynamic dataset ingestion, distributed spatio-temporal feature engineering, and real-time visual intelligence.

---

## 1. Project Overview

**TrafficPulse** provides an enterprise-grade multi-tier architecture to ingest, process, store, and analyze metropolitan vehicular traffic patterns. Combining the distributed computing power of **Apache PySpark**, the scalable document indexing of **MongoDB Atlas**, an **Express REST API**, and a modern **React analytics dashboard**, the platform transforms raw observation records into actionable urban mobility intelligence.

Unlike static analytics dashboards or simple CRUD applications, TrafficPulse dynamically recalculates all statistical models, rankings, and narrative conclusions directly from PySpark distributed transformations and MongoDB Atlas aggregation pipelines. Through its built-in **Dataset Studio**, analysts can upload new compatible metropolitan datasets (e.g., Pune, Mumbai, Thane) and instantly switch the active analytics context across all application views.

---

## 2. Problem Statement

Urban planners, traffic authorities, and municipal engineers face severe challenges in deciphering complex traffic dynamics:
- Traffic records are fragmented across spatial boundaries, time windows, and multi-modal vehicle classifications.
- Traditional single-node tools (e.g., standard Pandas or spreadsheet software) fail to scale across large-scale observation datasets and lack distributed parallelization.
- Identifying high-risk accident hotspots requires composite multi-criteria normalization rather than single-metric sorting.
- Analytical systems frequently rely on static hardcoded values rather than dynamic, data-driven synthesis.

---

## 3. Objectives

- **Distributed Data Processing**: Ingest and cleanse raw traffic records using Apache PySpark 4.2 with strict schema enforcement, casing standardization, and boundary validation.
- **Spatio-Temporal Feature Engineering**: Derive temporal features (day of week, calendar month, weekend flags, lag features) and spatial aggregations across arterial corridors.
- **Composite Hazard Scoring**: Formulate and compute normalized corridor risk rankings using weighted composite indexes ($0.5 \times \text{Volume} + 0.3 \times \text{Accidents} + 0.2 \times \text{Violations}$).
- **Cloud Database Storage**: Persist partitioned records, metadata, analytical metrics, and generated insights in **MongoDB Atlas** with optimized compound indexes.
- **Multi-Dataset Management & Ingestion**: Enable automated schema inspection, ingestion, and real-time switching between distinct city datasets via the **Dataset Studio**.
- **Interactive Multi-Module Dashboard**: Deliver an editorial-grade SaaS interface with 7 dedicated analytics pages and responsive desktop, tablet, and mobile views.

---

## 4. Key Features

- **Multi-Dataset Dynamics**: Ingest new city traffic CSVs on the fly; PySpark processes and partitions the data under an isolated `dataset_id`, storing it in MongoDB Atlas without colliding with existing datasets.
- **Instant Active Dataset Switching**: Switch between available datasets (e.g., Mumbai Metropolitan, Pune Traffic) from the Top Navbar dropdown or Dataset Studio, dynamically updating all 7 analytics pages.
- **Fail-Safe Processing Boundary**: If an uploaded dataset violates schema rules or processing fails, the application preserves the current active dataset and displays clean diagnostic feedback.
- **Interactive Slice & Dice Filter Studio**: Re-query the dataset across arbitrary combinations of date intervals, corridors, vehicle classes, days of the week, and congestion severity tiers via MongoDB aggregation pipelines.
- **Centroid-Based Hotspot Mapping**: Interactive Leaflet OpenStreetMap displaying ranked arterial corridors with color-coded markers and transparent methodology disclosures.
- **Deterministic Smart Insights**: Compiles factual analytical statements directly from computed constants without synthetic numbers or artificial mockups.

---

## 5. System Architecture

```
+-------------------------------------------------------------------------+
|                  DATASET INGESTION & UPLOAD LAYER                       |
|           (Raw CSV / Pune_Traffic_2025.csv / Custom Datasets)           |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                    APACHE PYSPARK BIG DATA PIPELINE                     |
|  - Schema Validation (StructType) & Casing Standardization (initcap)    |
|  - Value Boundary Assertions & Null Deduplication                       |
|  - Temporal Feature Engineering (year, month, dow, is_weekend)          |
|  - Pearson Statistical Correlation Matrix (stat.corr)                   |
|  - Min-Max Composite Hotspot Ranking (0.5*Vol + 0.3*Acc + 0.2*Viol)     |
|  - Deterministic Natural Language Insight Generation                    |
+-------------------------------------------------------------------------+
                                    |
                                    v (PyMongo Idempotent Load)
+-------------------------------------------------------------------------+
|                     MONGODB ATLAS CLUSTER (CLOUD)                       |
|  - datasets: Dataset metadata registry, active flags, row counts        |
|  - traffic_records: Cleaned granular observation documents              |
|  - traffic_analytics: Pre-aggregated summary metrics & timelines        |
|  - traffic_hotspots: Ranked spatial corridors with centroid coordinates |
|  - traffic_insights: Synthesized factual narrative items                |
|  - Compound Unique Index: { dataset_id: 1, metric_type: 1 }            |
+-------------------------------------------------------------------------+
                                    |
                                    v (Mongoose ODM / Express REST API)
+-------------------------------------------------------------------------+
|                        NODE.JS / EXPRESS BACKEND                        |
|  - Dataset Ingestion Controller (multer CSV upload & Python child_proc) |
|  - Dynamic Aggregation Pipelines for Custom Filter Combinations         |
|  - Active Dataset State Management & Switch Endpoints                   |
|  - Standard REST Envelope: { success: true, data: [...], meta: {...} }  |
+-------------------------------------------------------------------------+
                                    |
                                    v (HTTP REST API / Vite Proxy)
+-------------------------------------------------------------------------+
|                        REACT + VITE DASHBOARD                           |
|  - Tailwind CSS + Plus Jakarta Sans + Lucide Icons                      |
|  - Recharts Visualizations + Leaflet OpenStreetMap                      |
|  - Context-Driven Global Active Dataset State                           |
|  - 7 Analytics Modules + Dataset Studio Ingestion Hub                   |
+-------------------------------------------------------------------------+
```

---

## 6. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Big Data Processing** | Apache PySpark 4.2.0, Java OpenJDK 17 LTS, Python 3.12 |
| **Database & Cloud Storage** | MongoDB Atlas (M0/Shared Cloud Cluster), Mongoose 8.x, PyMongo 4.x |
| **Backend API** | Node.js v20+, Express 4.x, Multer, Cors, Dotenv |
| **Frontend Framework** | React 18, Vite, React Router v7, React Context API |
| **Styling & Design System** | Tailwind CSS v4, Plus Jakarta Sans, Lucide React Icons |
| **Visualization & Mapping** | Recharts (Area, Bar, Pie, Composed), React-Leaflet, OpenStreetMap |

---

## 7. The Analytics Modules

### 1. Dashboard (`/`)
High-level executive overview featuring 5 core KPI cards, daily vehicular flow area chart, weekly volume distribution bar chart, top 5 busiest corridors, incident breakdown donut chart, and a key insight banner.

### 2. Traffic Analysis (`/traffic`)
Interactive multi-dimensional slice-and-dice workspace with 6 filter controls (Start Date, End Date, Area / Location, Vehicle Category, Day of Week, Congestion Tier). Re-queries MongoDB Atlas aggregation pipelines dynamically.

### 3. Hotspots (`/hotspots`)
Spatio-temporal mapping module using Leaflet OpenStreetMap. Ranks arterial corridors by composite hazard score ($0.5 \times \text{Volume} + 0.3 \times \text{Accidents} + 0.2 \times \text{Violations}$) and places color-coded numbered centroid markers with zoom-to-corridor controls.

### 4. Time Analysis (`/time`)
Temporal rhythm and seasonality analysis covering weekly distributions, 12-month seasonality shifts, weekday vs. weekend modal splits, and full observation timelines.

### 5. Incidents & Enforcement (`/incidents`)
Correlates vehicular collisions with camera-detected traffic citations. Displays PySpark Pearson correlation coefficients ($r$) alongside monthly timelines and corridor-level violation rates.

### 6. Vehicle Analysis (`/vehicles`)
Dynamic modal classification presenting percentage volume share, category-specific volume counts, and empirical velocity variations across congestion tiers for all vehicle classes detected in the active dataset.

### 7. Smart Insights (`/insights`)
Editorial analytical report displaying 6 synthesis metric cards and the *"WHAT DOES THE DATA TELL US?"* section containing 6 deterministic narrative statements compiled by the PySpark pipeline.

### 8. Dataset Studio (`/datasets`)
Dataset management and ingestion portal. Supports drag-and-drop CSV upload, pre-flight schema and column verification, PySpark pipeline execution, and one-click active dataset switching.

---

## 8. PySpark Processing Pipeline

The PySpark processing engine (`analytics/pipeline.py`) runs the following stages:

1. **Schema Ingestion & Validation**: Reads the input CSV using a strict `StructType` schema. Validates required columns (`Date`, `City`, `Area`, `Vehicle_Type`, `Vehicle_Count`, `Accidents`, `Traffic_Violations`, `Avg_Speed_kmph`, `Congestion_Level`).
2. **Data Cleaning & Normalization**: Standardizes string casing using `initcap()`, trims whitespace, parses dates via `to_date()`, and filters out records with null keys or physically impossible metrics ($< 0$).
3. **Feature Engineering**: Derives calendar features (`year`, `month`, `month_name`, `day_of_week`, `day_name`, `is_weekend`) and rolling metrics using PySpark Window functions.
4. **Statistical Correlations**: Computes Pearson correlation coefficients ($r$) using `DataFrame.stat.corr()`.
5. **Hotspot Scoring & Normalization**: Applies min-max normalization to compute a composite hazard score and assigns High (Top 34%), Medium (Middle 33%), and Low tiers.
6. **MongoDB Atlas Ingestion**: Persists the outputs into MongoDB Atlas collections under the unique `dataset_id` using a compound unique index `{ dataset_id: 1, metric_type: 1 }`.

---

## 9. Installation & Local Setup

### Prerequisites
- **Node.js**: v18+ and npm
- **Python**: 3.10+ (Python 3.12 recommended)
- **Java Development Kit (JDK)**: OpenJDK 11 or 17 LTS (Required for Apache PySpark)
- **MongoDB Atlas**: Free cluster URL

### Step 1: Clone the Repository
```bash
git clone https://github.com/inamdarujair/trafficpulse-spatiotemporal-analytics.git
cd trafficpulse-spatiotemporal-analytics
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in the root and in the `backend/` directory:

```bash
# In the root directory
cp .env.example .env

# In the backend directory
cp backend/.env.example backend/.env
```

Open `.env` and set your MongoDB Atlas connection string:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mumbai_traffic?retryWrites=true&w=majority
```

### Step 3: Install Node.js Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### Step 4: Set Up Python Virtual Environment
```bash
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install Python requirements
pip install pyspark pymongo python-dotenv
```

### Step 5: Execute PySpark Pipeline & Seed Atlas
```bash
# Run the pipeline with the default Mumbai dataset
python analytics/pipeline.py --csv data/mumbai_traffic.csv --dataset-id mumbai_traffic_2025 --dataset-name "Mumbai Metropolitan Traffic (2025)"
```

### Step 6: Start Backend API
```bash
# In a new terminal
cd backend
npm run dev
# Backend starts at http://localhost:5000
```

### Step 7: Start Frontend Dashboard
```bash
# In a new terminal
cd frontend
npm run dev
# Frontend dashboard launches at http://localhost:3000
```

---

## 10. Environment Variables

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `5000` | Port for the Express REST API backend |
| `MONGODB_URI` | **Required** | None | Full MongoDB Atlas connection string |
| `NODE_ENV` | Optional | `development` | Environment mode (`development` / `production`) |

> **Security Notice**: Never commit `.env` files or hardcoded database passwords to version control. Use `.env.example` for environment templates.

---

## 11. REST API Specification

All endpoints dynamically scope queries to the currently active dataset in MongoDB Atlas:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | GET | Database connection health check and collection statistics |
| `/api/datasets` | GET | List all ingested datasets with metadata and active flags |
| `/api/datasets/active` | GET | Retrieve metadata of the currently active dataset |
| `/api/datasets/switch` | POST | Switch active dataset: `{ "dataset_id": "pune_traffic_2025" }` |
| `/api/datasets/inspect` | POST | Upload CSV via multipart/form-data for pre-flight validation |
| `/api/datasets/process` | POST | Trigger PySpark processing pipeline on an inspected CSV |
| `/api/filters` | GET | Retrieve dynamic filter bounds (dates, corridors, vehicle classes) |
| `/api/traffic/summary` | GET | Fetch key traffic metrics (volume, records, speed, incidents) |
| `/api/traffic/trends` | GET | Daily timeline vehicular throughput |
| `/api/traffic/daily` | GET | Weekly day-of-week aggregations (Sunday - Saturday) |
| `/api/traffic/monthly` | GET | Month-by-month volume distributions |
| `/api/traffic/locations` | GET | Corridor rankings with accident and violation rates |
| `/api/traffic/hotspots` | GET | Ranked composite hotspots with centroid coordinates |
| `/api/incidents` | GET | Incident timelines, corridor breakdowns, and Pearson correlations |
| `/api/vehicles` | GET | Modal split, category volume distributions, and speeds |
| `/api/insights` | GET | Deterministic fact cards and synthesized narrative statements |

---

## 12. Project Screenshots

| Page | View Description | Screenshot Artifact |
| :--- | :--- | :--- |
| **Page 1: Dashboard** | Executive KPIs, Line Trend, Day-of-week Bar, Top Corridors | `screenshots/page_1_dashboard.png` |
| **Page 2: Traffic Analysis** | Interactive Filters (Date, Area, Vehicle, Day, Congestion) | `screenshots/page_2_traffic_analysis.png` |
| **Page 2: Filtered State** | Dynamic recalculation matching Bandra corridor | `screenshots/page_2_traffic_analysis_filtered.png` |
| **Page 3: Hotspots** | Leaflet OpenStreetMap with High/Medium/Low Centroid Pins | `screenshots/page_3_hotspots.png` |
| **Page 4: Time Analysis** | Day of Week, Monthly seasonality, Weekday vs Weekend | `screenshots/page_4_time_analysis.png` |
| **Page 5: Incidents** | Accidents, Violations, Correlation Matrix ($r$ values) | `screenshots/page_5_incidents.png` |
| **Page 6: Vehicles** | Modal Share Donut (Auto, Bus, Car, Truck, Bike) & Speeds | `screenshots/page_6_vehicles.png` |
| **Page 7: Smart Insights** | 6 Dynamic Synthesis Cards & "What Does the Data Tell Us?" | `screenshots/page_7_smart_insights.png` |
| **Page 8: Dataset Studio** | CSV Pre-flight Analysis, PySpark Trigger & Dataset Switcher | `screenshots/page_8_dataset_studio.png` |

---

## 13. Future Scope

- **Real-Time Streaming**: Ingest streaming camera telemetry via **Apache Kafka** into **Spark Structured Streaming** for continuous micro-batch sliding-window analysis.
- **Predictive Traffic Modeling**: Implement distributed machine learning using **Spark MLlib** (e.g., GBTRegressor / Random Forest) to forecast congestion levels 24 hours in advance based on historical weather and holiday patterns.
- **Automated Polygon Geofencing**: Transition from geographic point centroids to GeoJSON corridor boundary polygons for precise municipal jurisdiction analysis.
- **Export & Reporting Hub**: Generate automated PDF and Excel executive mobility briefs from the Smart Insights module.

---

## 14. License

This project is developed for educational and academic purposes under the Big Data Analytics Laboratory curriculum.
