"""
Migration Script: Register Mumbai dataset in MongoDB Atlas and tag existing documents with dataset_id
"""
import config
import pymongo
from datetime import datetime, timezone

def run_migration():
    client = pymongo.MongoClient(config.MONGO_URI)
    db = client[config.DATABASE_NAME]

    mumbai_id = "mumbai_traffic_2025"

    for col_name in ['traffic_records', 'traffic_analytics', 'traffic_hotspots', 'traffic_insights', 'traffic_metadata']:
        res = db[col_name].update_many(
            {"dataset_id": {"$exists": False}},
            {"$set": {"dataset_id": mumbai_id}}
        )
        print(f"[MIGRATION] {col_name}: tagged {res.modified_count} documents with dataset_id={mumbai_id}")

    # Register Mumbai dataset
    db['datasets'].update_one(
        {"dataset_id": mumbai_id},
        {
            "$set": {
                "dataset_id": mumbai_id,
                "dataset_name": "Mumbai Metropolitan Traffic (2025)",
                "filename": "traffic_dataset.csv",
                "uploaded_at": datetime.now(timezone.utc),
                "record_count": 234,
                "date_range": {"start": "2025-01-02", "end": "2025-12-31"},
                "cities": ["Mumbai"],
                "areas": ["Andheri", "Bandra", "Dadar", "Lower Parel", "Malad"],
                "vehicle_types": ["Auto", "Bike", "Bus", "Car", "Truck"],
                "detected_columns": [
                    "Date", "City", "Area", "Vehicle_Type", "Vehicle_Count",
                    "Accidents", "Traffic_Violations", "Avg_Speed_kmph", "Congestion_Level"
                ],
                "capabilities": {
                    "traffic_volume": True,
                    "temporal_daily": True,
                    "temporal_hourly": False,
                    "temporal_granularity": "daily",
                    "location_area": True,
                    "location_city": True,
                    "location_gps": False,
                    "vehicle_analysis": True,
                    "incidents_surveillance": True
                },
                "is_active": True
            }
        },
        upsert=True
    )
    print("[MIGRATION] 'datasets' collection initialized with Mumbai dataset as active.")

if __name__ == "__main__":
    run_migration()
