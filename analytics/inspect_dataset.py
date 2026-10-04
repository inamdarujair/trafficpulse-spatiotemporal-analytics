import os
import json
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, count, when, min, max

def inspect_dataset():
    data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "traffic_dataset.csv"))
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "output"))
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "dataset_profile.json")

    print(f"==================================================")
    print(f"INSPECTING DATASET: {data_path}")
    print(f"==================================================")

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    spark = SparkSession.builder \
        .appName("MumbaiTrafficDatasetInspection") \
        .master("local[*]") \
        .config("spark.driver.bindAddress", "127.0.0.1") \
        .getOrCreate()
    
    spark.sparkContext.setLogLevel("ERROR")

    # Read CSV
    df = spark.read.option("header", "true").option("inferSchema", "true").csv(data_path)

    schema_info = {f.name: str(f.dataType) for f in df.schema.fields}
    col_names = df.columns
    total_records = df.count()

    # Missing values safely checked per data type
    missing_exprs = [
        count(when(col(c).isNull() | (col(c).cast("string") == "") | (col(c).cast("string") == "null") | (col(c).cast("string") == "NaN"), c)).alias(c)
        for c in col_names
    ]
    missing_row = df.select(missing_exprs).collect()[0]
    missing_values = {c: missing_row[c] for c in col_names}

    # Duplicate record count
    distinct_count = df.distinct().count()
    duplicate_count = total_records - distinct_count

    # Unique cities
    cities_df = df.groupBy("City").count().orderBy(col("count").desc())
    cities_counts = {row["City"]: row["count"] for row in cities_df.collect() if row["City"] is not None}

    # Unique areas overall
    areas_df = df.groupBy("Area").count().orderBy(col("count").desc())
    unique_areas_overall = [row["Area"] for row in areas_df.collect() if row["Area"] is not None]

    # Unique areas for Mumbai
    mumbai_areas_df = df.filter(col("City") == "Mumbai").groupBy("Area").count().orderBy(col("count").desc())
    mumbai_areas = {row["Area"]: row["count"] for row in mumbai_areas_df.collect() if row["Area"] is not None}

    # Unique vehicle types
    vehicles_df = df.groupBy("Vehicle_Type").count().orderBy(col("count").desc())
    unique_vehicles = {row["Vehicle_Type"]: row["count"] for row in vehicles_df.collect() if row["Vehicle_Type"] is not None}

    # Date and time fields
    has_date = "Date" in col_names
    has_time = any("hour" in c.lower() or "time" in c.lower() for c in col_names)
    
    date_stats = {}
    if has_date:
        d_min, d_max = df.select(min("Date"), max("Date")).collect()[0]
        date_stats = {
            "has_date": True,
            "has_time_or_hour": has_time,
            "min_date": str(d_min),
            "max_date": str(d_max),
            "granularity": "daily" if not has_time else "hourly"
        }
    else:
        date_stats = {
            "has_date": False,
            "has_time_or_hour": False,
            "min_date": None,
            "max_date": None,
            "granularity": "none"
        }

    # Lat / Long - exact column name check, not substring (avoid matching 'traffic_violations')
    coord_keywords = {"lat", "latitude", "lng", "lon", "longitude"}
    has_coordinates = any(c.lower() in coord_keywords for c in col_names)

    # Congestion Level
    congestion_vals = {}
    if "Congestion_Level" in col_names:
        cg_df = df.groupBy("Congestion_Level").count().collect()
        congestion_vals = {row["Congestion_Level"]: row["count"] for row in cg_df if row["Congestion_Level"] is not None}

    # Capability Map
    capability_map = {
        "traffic_volume": "Vehicle_Count" in col_names,
        "temporal_daily": has_date,
        "temporal_hourly": has_time,
        "temporal_granularity": "daily" if not has_time else "hourly",
        "location_area": "Area" in col_names,
        "location_city": "City" in col_names,
        "location_gps": has_coordinates,
        "vehicle_analysis": "Vehicle_Type" in col_names and "Vehicle_Count" in col_names,
        "accident_analysis": "Accidents" in col_names,
        "violation_analysis": "Traffic_Violations" in col_names,
        "speed_analysis": "Avg_Speed_kmph" in col_names,
        "congestion_analysis": "Congestion_Level" in col_names
    }

    profile = {
        "file_path": data_path,
        "file_type": "CSV",
        "schema": schema_info,
        "columns": col_names,
        "record_count": total_records,
        "data_types": schema_info,
        "missing_values": missing_values,
        "duplicate_count": duplicate_count,
        "cities": cities_counts,
        "unique_areas_overall": unique_areas_overall,
        "mumbai_areas": mumbai_areas,
        "vehicle_types": unique_vehicles,
        "date_time_info": date_stats,
        "has_gps_coordinates": has_coordinates,
        "congestion_level_distribution": congestion_vals,
        "capability_map": capability_map
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2)

    print(f"Profile saved to: {output_file}")
    print("\n--- SUMMARY PROFILE ---")
    print(f"Total Records: {total_records}")
    print(f"Columns: {col_names}")
    print(f"Cities: {cities_counts}")
    print(f"Mumbai Areas ({len(mumbai_areas)}): {list(mumbai_areas.keys())}")
    print(f"Vehicle Types: {list(unique_vehicles.keys())}")
    print(f"Date Range: {date_stats.get('min_date')} to {date_stats.get('max_date')}")
    print(f"Hourly Data Available: {has_time}")
    print(f"GPS Coordinates Available: {has_coordinates}")
    print(f"Congestion Levels: {congestion_vals}")
    print(f"Capabilities: {capability_map}")

    spark.stop()
    return profile

if __name__ == "__main__":
    inspect_dataset()
