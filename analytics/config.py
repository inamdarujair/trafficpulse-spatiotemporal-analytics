"""
Central Configuration for Mumbai Traffic Pattern Analytics
"""
import os
from dotenv import load_dotenv

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
DATA_PATH = os.path.join(PROJECT_ROOT, "data", "traffic_dataset.csv")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
AREA_CENTROIDS_PATH = os.path.join(BASE_DIR, "area_centroids.json")

# Load environment variables from .env
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))
load_dotenv(os.path.join(PROJECT_ROOT, "backend", ".env"))

# MongoDB settings from environment configuration
MONGO_URI = os.getenv("MONGODB_URI")
if not MONGO_URI:
    raise ValueError("CRITICAL CONFIG ERROR: MONGODB_URI environment variable is missing in .env")

DATABASE_NAME = "mumbai_traffic"

COLLECTIONS = {
    "records": "traffic_records",
    "analytics": "traffic_analytics",
    "hotspots": "traffic_hotspots",
    "insights": "traffic_insights",
    "metadata": "traffic_metadata"
}

# Column Mapping Dictionary (Raw CSV Column -> Standard Normalized Name)
COLUMN_MAPPING = {
    "Date": "date",
    "City": "city",
    "Area": "area",
    "Vehicle_Type": "vehicle_type",
    "Vehicle_Count": "vehicle_count",
    "Accidents": "accidents",
    "Traffic_Violations": "traffic_violations",
    "Avg_Speed_kmph": "avg_speed_kmph",
    "Congestion_Level": "congestion_level"
}

REQUIRED_COLUMNS = list(COLUMN_MAPPING.keys())

# Day name mapping for consistency
DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]
