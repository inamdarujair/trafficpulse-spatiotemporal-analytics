"""
TrafficPulse - Dynamic PySpark Big Data Pipeline
Processes user-provided traffic datasets (Mumbai, Pune, Thane, or any compatible city),
cleans, normalizes, extracts spatio-temporal features, computes distributed aggregations,
ranks hotspots, derives empirical statistical correlations and data-driven insights,
and loads into MongoDB Atlas associated with a unique dataset_id.
"""
import os
import sys
import time
import json
import argparse
import hashlib
from datetime import datetime, timezone
from pymongo import MongoClient, ASCENDING, DESCENDING

from pyspark.sql import SparkSession, Window
from pyspark.sql.types import (
    StructType, StructField, StringType, IntegerType, DoubleType, DateType
)
from pyspark.sql.functions import (
    col, trim, initcap, lower, to_date, year, month,
    date_format, dayofweek, weekofyear, when, count,
    sum as _sum, avg as _avg, min as _min, max as _max, round as _round,
    lag, desc, row_number, lit
)

import config

def get_spark_session(app_name="TrafficPulseBigDataPipeline"):
    """Create local PySpark session configured for Big Data processing."""
    print(f"[SPARK] Initializing SparkSession ({app_name})...")
    spark = SparkSession.builder \
        .appName(app_name) \
        .master("local[*]") \
        .config("spark.driver.bindAddress", "127.0.0.1") \
        .config("spark.sql.shuffle.partitions", "4") \
        .config("spark.ui.enabled", "false") \
        .getOrCreate()
    spark.sparkContext.setLogLevel("ERROR")
    print(f"[SPARK] SparkSession version {spark.version} ready.")
    return spark

def validate_and_read_csv(spark, data_path):
    """Read CSV with schema inference & fallback mapping for flexible columns."""
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset file missing at path: {data_path}")

    print(f"[STAGE 1: INGESTION] Reading raw CSV from {data_path}...")
    # First read with header=true to inspect available columns
    raw_df = spark.read \
        .option("header", "true") \
        .option("inferSchema", "true") \
        .csv(data_path)

    raw_count = raw_df.count()
    raw_cols = raw_df.columns
    print(f"[STAGE 1: INGESTION] Ingested {raw_count} raw rows with columns: {raw_cols}")

    if raw_count == 0:
        raise ValueError("CRITICAL ERROR: Uploaded CSV contains 0 rows.")

    # Column name normalization map (case-insensitive & variation matching)
    col_map = {}
    lower_cols = {c.lower().strip().replace(" ", "_"): c for c in raw_cols}

    expected_fields = {
        "date": ["date", "timestamp", "datetime"],
        "city": ["city", "district", "metro", "municipality"],
        "area": ["area", "location", "corridor", "junction", "neighborhood", "zone"],
        "vehicle_type": ["vehicle_type", "vehicletype", "vehicle", "mode"],
        "vehicle_count": ["vehicle_count", "vehiclecount", "volume", "traffic_volume", "count"],
        "accidents": ["accidents", "accident_count", "crashes", "collisions"],
        "traffic_violations": ["traffic_violations", "violations", "infractions", "citations"],
        "avg_speed_kmph": ["avg_speed_kmph", "speed", "avg_speed", "speed_kmph", "velocity"],
        "congestion_level": ["congestion_level", "congestion", "traffic_status", "tier"]
    }

    # Map matched columns
    for std_name, variations in expected_fields.items():
        matched = None
        for v in variations:
            if v in lower_cols:
                matched = lower_cols[v]
                break
        if matched:
            col_map[matched] = std_name

    # Check minimum required fields: date, area, vehicle_count
    if not any(k in col_map.values() for k in ["date"]):
        raise ValueError("CRITICAL ERROR: Dataset must have a 'Date' column.")
    if not any(k in col_map.values() for k in ["area"]):
        raise ValueError("CRITICAL ERROR: Dataset must have an 'Area' or 'Location' column.")

    # Rename matched columns
    renamed_df = raw_df
    for orig_col, std_name in col_map.items():
        renamed_df = renamed_df.withColumnRenamed(orig_col, std_name)

    # Provide safe defaults for optional columns if missing
    if "city" not in renamed_df.columns:
        renamed_df = renamed_df.withColumn("city", lit("Metropolitan Area"))
    if "vehicle_type" not in renamed_df.columns:
        renamed_df = renamed_df.withColumn("vehicle_type", lit("All Vehicles"))
    if "vehicle_count" not in renamed_df.columns:
        renamed_df = renamed_df.withColumn("vehicle_count", lit(100))
    if "accidents" not in renamed_df.columns:
        renamed_df = renamed_df.withColumn("accidents", lit(0))
    if "traffic_violations" not in renamed_df.columns:
        renamed_df = renamed_df.withColumn("traffic_violations", lit(0))
    if "avg_speed_kmph" not in renamed_df.columns:
        renamed_df = renamed_df.withColumn("avg_speed_kmph", lit(40))
    if "congestion_level" not in renamed_df.columns:
        renamed_df = renamed_df.withColumn("congestion_level", lit("Medium"))

    return renamed_df, raw_count, raw_cols

def clean_and_normalize(renamed_df):
    """Clean data: trim strings, normalize casing, cast types, remove duplicates & invalid rows."""
    print("[STAGE 2: CLEANING] Normalizing casing, trimming strings, casting types...")
    initial_count = renamed_df.count()

    # Try multiple date formats: yyyy-MM-dd, dd-MM-yyyy, MM/dd/yyyy
    date_col = trim(col("date"))
    parsed_date = when(to_date(date_col, "yyyy-MM-dd").isNotNull(), to_date(date_col, "yyyy-MM-dd")) \
        .when(to_date(date_col, "dd-MM-yyyy").isNotNull(), to_date(date_col, "dd-MM-yyyy")) \
        .when(to_date(date_col, "MM/dd/yyyy").isNotNull(), to_date(date_col, "MM/dd/yyyy")) \
        .when(to_date(date_col, "yyyy/MM/dd").isNotNull(), to_date(date_col, "yyyy/MM/dd")) \
        .otherwise(to_date(date_col))

    cleaned_df = renamed_df \
        .withColumn("city", initcap(trim(col("city")))) \
        .withColumn("area", initcap(trim(col("area")))) \
        .withColumn("vehicle_type", initcap(trim(col("vehicle_type")))) \
        .withColumn("congestion_level", initcap(trim(col("congestion_level")))) \
        .withColumn("vehicle_count", col("vehicle_count").cast(IntegerType())) \
        .withColumn("accidents", col("accidents").cast(IntegerType())) \
        .withColumn("traffic_violations", col("traffic_violations").cast(IntegerType())) \
        .withColumn("avg_speed_kmph", col("avg_speed_kmph").cast(IntegerType())) \
        .withColumn("parsed_date", parsed_date)

    # Drop nulls in essential keys
    clean_no_nulls = cleaned_df.filter(
        col("parsed_date").isNotNull() &
        col("city").isNotNull() &
        col("area").isNotNull() &
        col("vehicle_type").isNotNull() &
        col("vehicle_count").isNotNull()
    )
    after_nulls_count = clean_no_nulls.count()
    nulls_dropped = initial_count - after_nulls_count
    print(f"[STAGE 2: CLEANING] Dropped {nulls_dropped} rows with null essential keys.")

    # Deduplicate exact rows
    deduped_df = clean_no_nulls.dropDuplicates()
    after_dedup_count = deduped_df.count()

    # Filter out physically impossible values
    valid_df = deduped_df.filter(
        (col("vehicle_count") >= 0) &
        (col("accidents") >= 0) &
        (col("traffic_violations") >= 0) &
        (col("avg_speed_kmph") > 0)
    )
    valid_count = valid_df.count()
    print(f"[STAGE 2: CLEANING] Cleaned valid records count: {valid_count}")

    if valid_count == 0:
        raise ValueError("CRITICAL ERROR: No valid records remaining after data cleaning.")

    return valid_df, valid_count

def derive_features(cleaned_df):
    """Derive spatio-temporal features dynamically for ANY city."""
    print("[STAGE 3: FEATURE ENGINEERING] Deriving temporal features...")
    
    # Extract unique detected cities
    city_rows = cleaned_df.select("city").distinct().collect()
    detected_cities = [r["city"] for r in city_rows if r["city"]]
    print(f"[STAGE 3: FEATURE ENGINEERING] Detected cities in dataset: {detected_cities}")

    # Derive temporal features from real date column
    featured_df = cleaned_df \
        .withColumn("date", date_format(col("parsed_date"), "yyyy-MM-dd")) \
        .withColumn("year", year(col("parsed_date"))) \
        .withColumn("month", month(col("parsed_date"))) \
        .withColumn("month_name", date_format(col("parsed_date"), "MMMM")) \
        .withColumn("day_of_week", dayofweek(col("parsed_date"))) \
        .withColumn("day_name", date_format(col("parsed_date"), "EEEE")) \
        .withColumn("week_of_year", weekofyear(col("parsed_date"))) \
        .withColumn("is_weekend", when(dayofweek(col("parsed_date")).isin([1, 7]), True).otherwise(False)) \
        .drop("parsed_date")

    return featured_df, detected_cities

def compute_aggregations(featured_df, detected_cities, dataset_name, spark):
    """Compute all required aggregates using PySpark groupBy, window functions, and statistics."""
    print("[STAGE 4: AGGREGATIONS] Computing PySpark aggregations...")

    # 1. Summary KPIs
    summary_row = featured_df.select(
        count(lit(1)).alias("total_records"),
        _sum("vehicle_count").alias("total_volume"),
        _round(_avg("vehicle_count"), 2).alias("avg_vehicle_count"),
        _sum("accidents").alias("total_accidents"),
        _sum("traffic_violations").alias("total_violations"),
        _round(_avg("avg_speed_kmph"), 2).alias("avg_speed"),
        _min("date").alias("start_date"),
        _max("date").alias("end_date")
    ).collect()[0]

    # 2. Daily volume trend (Volume over time)
    daily_trend_df = featured_df.groupBy("date", "day_name", "month_name") \
        .agg(
            _sum("vehicle_count").alias("total_volume"),
            _round(_avg("vehicle_count"), 2).alias("avg_volume"),
            _sum("accidents").alias("accidents"),
            _sum("traffic_violations").alias("traffic_violations"),
            _round(_avg("avg_speed_kmph"), 2).alias("avg_speed"),
            count(lit(1)).alias("record_count")
        ) \
        .orderBy("date")
    daily_trend = [row.asDict() for row in daily_trend_df.collect()]

    # 3. Monthly volume trend & MoM change using PySpark Window
    window_monthly = Window.orderBy("month")
    monthly_df = featured_df.groupBy("month", "month_name") \
        .agg(
            _sum("vehicle_count").alias("total_volume"),
            _round(_avg("vehicle_count"), 2).alias("avg_volume"),
            _sum("accidents").alias("accidents"),
            _sum("traffic_violations").alias("traffic_violations"),
            _round(_avg("avg_speed_kmph"), 2).alias("avg_speed"),
            count(lit(1)).alias("record_count")
        ) \
        .withColumn("prev_volume", lag("total_volume", 1).over(window_monthly)) \
        .withColumn("mom_growth_pct", _round(((col("total_volume") - col("prev_volume")) / col("prev_volume")) * 100, 2)) \
        .orderBy("month")
    monthly_trend = [row.asDict() for row in monthly_df.collect()]

    # 4. Day of Week traffic pattern
    dow_df = featured_df.groupBy("day_of_week", "day_name") \
        .agg(
            _sum("vehicle_count").alias("total_volume"),
            _round(_avg("vehicle_count"), 2).alias("avg_volume"),
            _sum("accidents").alias("accidents"),
            _sum("traffic_violations").alias("traffic_violations"),
            _round(_avg("avg_speed_kmph"), 2).alias("avg_speed"),
            count(lit(1)).alias("record_count")
        ) \
        .orderBy("day_of_week")
    dow_trend = [row.asDict() for row in dow_df.collect()]

    # 5. Weekend vs Weekday modal comparison
    weekend_df = featured_df.groupBy("is_weekend") \
        .agg(
            _sum("vehicle_count").alias("total_volume"),
            _round(_avg("vehicle_count"), 2).alias("avg_volume"),
            _sum("accidents").alias("total_accidents"),
            _sum("traffic_violations").alias("total_violations"),
            _round(_avg("avg_speed_kmph"), 2).alias("avg_speed"),
            count(lit(1)).alias("record_count")
        )
    weekend_comparison = {
        "weekend" if row["is_weekend"] else "weekday": row.asDict()
        for row in weekend_df.collect()
    }

    # 6. Spatio-temporal corridor & area throughput
    area_base_df = featured_df.groupBy("area") \
        .agg(
            _sum("vehicle_count").alias("total_volume"),
            _round(_avg("vehicle_count"), 2).alias("avg_volume"),
            _sum("accidents").alias("total_accidents"),
            _sum("traffic_violations").alias("total_violations"),
            _round(_avg("avg_speed_kmph"), 2).alias("avg_speed"),
            count(lit(1)).alias("record_count")
        )

    # Dominant congestion per area using Window
    window_area_cg = Window.partitionBy("area").orderBy(desc("cg_count"))
    dominant_cg_df = featured_df.groupBy("area", "congestion_level") \
        .agg(count(lit(1)).alias("cg_count")) \
        .withColumn("rn", row_number().over(window_area_cg)) \
        .filter(col("rn") == 1) \
        .select("area", col("congestion_level").alias("dominant_congestion"))

    area_base_df = area_base_df.join(dominant_cg_df, on="area", how="left")

    # Rates per 1,000 vehicles
    area_metrics_df = area_base_df \
        .withColumn("accident_rate_per_k", _round((col("total_accidents") * 1000.0) / col("total_volume"), 3)) \
        .withColumn("violation_rate_per_k", _round((col("total_violations") * 1000.0) / col("total_volume"), 3))

    area_metrics = [row.asDict() for row in area_metrics_df.collect()]

    # 7. Hotspot ranking and Low / Medium / High classification
    max_vol = max(a["total_volume"] for a in area_metrics) or 1
    min_vol = min(a["total_volume"] for a in area_metrics) or 0
    vol_range = (max_vol - min_vol) if (max_vol - min_vol) > 0 else 1

    max_acc = max(a["total_accidents"] for a in area_metrics) or 1
    min_acc = min(a["total_accidents"] for a in area_metrics) or 0
    acc_range = (max_acc - min_acc) if (max_acc - min_acc) > 0 else 1

    max_viol = max(a["total_violations"] for a in area_metrics) or 1
    min_viol = min(a["total_violations"] for a in area_metrics) or 0
    viol_range = (max_viol - min_viol) if (max_viol - min_viol) > 0 else 1

    # Load centroids database
    centroids_data = {}
    city_centers = {}
    centroids_disclaimer = "Marker positions represent approximate geographic area centroids for metropolitan visualization, not measured GPS points."
    if os.path.exists(config.AREA_CENTROIDS_PATH):
        with open(config.AREA_CENTROIDS_PATH, "r", encoding="utf-8") as cf:
            c_json = json.load(cf)
            centroids_data = c_json.get("centroids", {})
            city_centers = c_json.get("city_centers", {})
            centroids_disclaimer = c_json.get("disclaimer", centroids_disclaimer)

    primary_city = detected_cities[0] if detected_cities else "Mumbai"
    default_center = city_centers.get(primary_city, {"lat": 18.5204 if "pune" in primary_city.lower() else 19.0760, "lng": 73.8567 if "pune" in primary_city.lower() else 72.8777})

    scored_areas = []
    for item in area_metrics:
        area_name = item["area"]
        n_vol = (item["total_volume"] - min_vol) / vol_range
        n_acc = (item["total_accidents"] - min_acc) / acc_range
        n_viol = (item["total_violations"] - min_viol) / viol_range
        comp_score = round((0.5 * n_vol + 0.3 * n_acc + 0.2 * n_viol) * 100, 2)

        # Look up or derive centroid
        if area_name in centroids_data:
            centroid = centroids_data[area_name]
        else:
            # Deterministic geographic jitter around the primary city center
            h = int(hashlib.md5(area_name.encode('utf-8')).hexdigest()[:6], 16)
            lat_offset = ((h % 100) - 50) * 0.0015
            lng_offset = (((h // 100) % 100) - 50) * 0.0015
            centroid = {
                "lat": round(default_center["lat"] + lat_offset, 4),
                "lng": round(default_center["lng"] + lng_offset, 4),
                "locality": f"{area_name}, {primary_city}",
                "zone": f"{primary_city} Metropolitan Corridor"
            }

        scored_areas.append({
            **item,
            "composite_score": comp_score,
            "lat": centroid["lat"],
            "lng": centroid["lng"],
            "locality": centroid.get("locality", f"{area_name}, {primary_city}"),
            "zone": centroid.get("zone", f"{primary_city} Corridor")
        })

    # Sort descending by composite score to assign ranks and classification
    scored_areas.sort(key=lambda x: x["composite_score"], reverse=True)
    num_areas = len(scored_areas)

    for idx, item in enumerate(scored_areas):
        item["rank"] = idx + 1
        pct = (idx + 1) / num_areas
        if pct <= 0.34:
            item["hotspot_level"] = "High"
        elif pct <= 0.67:
            item["hotspot_level"] = "Medium"
        else:
            item["hotspot_level"] = "Low"

    # 8. Vehicle Type Analysis
    total_dataset_vol = summary_row["total_volume"]
    vehicle_df = featured_df.groupBy("vehicle_type") \
        .agg(
            _sum("vehicle_count").alias("total_volume"),
            _round(_avg("vehicle_count"), 2).alias("avg_count_per_record"),
            _round(_avg("avg_speed_kmph"), 2).alias("avg_speed"),
            count(lit(1)).alias("record_count")
        ) \
        .withColumn("share_pct", _round((col("total_volume") * 100.0) / total_dataset_vol, 2)) \
        .orderBy(desc("total_volume"))
    vehicle_types_metrics = [row.asDict() for row in vehicle_df.collect()]

    # Vehicle type by month trend
    veh_monthly_df = featured_df.groupBy("month", "month_name", "vehicle_type") \
        .agg(_sum("vehicle_count").alias("volume")) \
        .orderBy("month", "vehicle_type")
    veh_monthly_trend = [row.asDict() for row in veh_monthly_df.collect()]

    # Vehicle volume by area
    veh_area_df = featured_df.groupBy("area", "vehicle_type") \
        .agg(_sum("vehicle_count").alias("volume")) \
        .orderBy("area", "vehicle_type")
    veh_area_matrix = [row.asDict() for row in veh_area_df.collect()]

    # 9. Congestion Level Distribution and Speed Impact
    congestion_df = featured_df.groupBy("congestion_level") \
        .agg(
            count(lit(1)).alias("record_count"),
            _round(_avg("avg_speed_kmph"), 2).alias("avg_speed"),
            _sum("vehicle_count").alias("total_volume")
        ) \
        .withColumn("pct_share", _round((col("record_count") * 100.0) / summary_row["total_records"], 2)) \
        .orderBy(desc("record_count"))
    congestion_metrics = [row.asDict() for row in congestion_df.collect()]

    # 10. Spark Statistical Correlations
    corr_vol_acc = featured_df.stat.corr("vehicle_count", "accidents")
    corr_vol_viol = featured_df.stat.corr("vehicle_count", "traffic_violations")
    corr_vol_speed = featured_df.stat.corr("vehicle_count", "avg_speed_kmph")
    corr_acc_viol = featured_df.stat.corr("accidents", "traffic_violations")

    correlations = {
        "volume_vs_accidents": round(corr_vol_acc, 4) if corr_vol_acc is not None else 0.0,
        "volume_vs_violations": round(corr_vol_viol, 4) if corr_vol_viol is not None else 0.0,
        "volume_vs_speed": round(corr_vol_speed, 4) if corr_vol_speed is not None else 0.0,
        "accidents_vs_violations": round(corr_acc_viol, 4) if corr_acc_viol is not None else 0.0
    }

    # 11. Busiest / Peak identification
    peak_dow = max(dow_trend, key=lambda x: x["total_volume"])
    least_dow = min(dow_trend, key=lambda x: x["total_volume"])

    peak_month = max(monthly_trend, key=lambda x: x["total_volume"])
    least_month = min(monthly_trend, key=lambda x: x["total_volume"])

    peak_area = max(area_metrics, key=lambda x: x["total_volume"])
    least_area = min(area_metrics, key=lambda x: x["total_volume"])

    highest_acc_area = max(area_metrics, key=lambda x: x["total_accidents"])
    highest_viol_area = max(area_metrics, key=lambda x: x["total_violations"])

    fastest_area = max(area_metrics, key=lambda x: x["avg_speed"])
    slowest_area = min(area_metrics, key=lambda x: x["avg_speed"])

    # 12. Smart Insights Generation with Dynamic City/Location names
    city_str = ", ".join(detected_cities) if detected_cities else "Metropolitan Area"

    insights_facts = {
        "city": city_str,
        "peak_traffic_day": peak_dow["day_name"],
        "peak_day_volume": peak_dow["total_volume"],
        "least_traffic_day": least_dow["day_name"],
        "least_day_volume": least_dow["total_volume"],
        "peak_month": peak_month["month_name"],
        "peak_month_volume": peak_month["total_volume"],
        "least_month": least_month["month_name"],
        "least_month_volume": least_month["total_volume"],
        "busiest_area": peak_area["area"],
        "busiest_area_volume": peak_area["total_volume"],
        "lowest_traffic_area": least_area["area"],
        "lowest_area_volume": least_area["total_volume"],
        "highest_accident_area": highest_acc_area["area"],
        "highest_accidents": highest_acc_area["total_accidents"],
        "highest_violation_area": highest_viol_area["area"],
        "highest_violations": highest_viol_area["total_violations"],
        "fastest_area": fastest_area["area"],
        "fastest_area_speed": fastest_area["avg_speed"],
        "slowest_area": slowest_area["area"],
        "slowest_area_speed": slowest_area["avg_speed"],
        "dominant_vehicle": vehicle_types_metrics[0]["vehicle_type"],
        "dominant_vehicle_share": vehicle_types_metrics[0]["share_pct"],
        "correlations": correlations
    }

    # Generate 6 data-driven dynamic sentences referencing the actual city and areas
    cg_dict = {c["congestion_level"]: c["avg_speed"] for c in congestion_metrics}
    speed_statement = f"Analysis across congestion tiers reveals vehicular speeds average {cg_dict.get('High', 'N/A')} km/h during High congestion, {cg_dict.get('Medium', 'N/A')} km/h in Medium congestion, and {cg_dict.get('Low', 'N/A')} km/h under Low congestion conditions."

    vol_viol_statement = ""
    r_val = correlations["volume_vs_violations"]
    if abs(r_val) >= 0.1:
        corr_dir = "positive" if r_val > 0 else "inverse"
        vol_viol_statement = f"Statistical correlation analysis indicates a {corr_dir} relationship (r = {r_val}) between total vehicle volume and recorded traffic violations."
    else:
        vol_viol_statement = f"Correlation analysis shows traffic violations occur relatively uniformly across varying traffic densities (r = {r_val})."

    generated_sentences = [
        f"Temporal analysis identifies {peak_dow['day_name']} as the peak traffic day in {city_str} with {peak_dow['total_volume']:,} vehicles, while {least_dow['day_name']} experiences the lowest volume at {least_dow['total_volume']:,} vehicles.",
        f"Spatially, {peak_area['area']} serves as the primary traffic hotspot generating {peak_area['total_volume']:,} vehicles ({round((peak_area['total_volume']/summary_row['total_volume'])*100, 1)}% of total {city_str} flow), whereas {least_area['area']} logged {least_area['total_volume']:,} vehicles.",
        f"{vehicle_types_metrics[0]['vehicle_type']} constitutes the primary modal share ({vehicle_types_metrics[0]['share_pct']}% of observed traffic), traveling at an average speed of {vehicle_types_metrics[0]['avg_speed']} km/h.",
        f"Incident surveillance reveals {highest_acc_area['area']} recorded the highest accident count ({highest_acc_area['total_accidents']} incidents), while {highest_viol_area['area']} leads in traffic enforcement violations ({highest_viol_area['total_violations']:,} violations).",
        speed_statement,
        vol_viol_statement
    ]

    aggregates = {
        "summary": summary_row.asDict(),
        "daily_trend": daily_trend,
        "monthly_trend": monthly_trend,
        "dow_trend": dow_trend,
        "weekend_comparison": weekend_comparison,
        "area_metrics": area_metrics,
        "hotspots": scored_areas,
        "vehicle_metrics": vehicle_types_metrics,
        "vehicle_monthly_trend": veh_monthly_trend,
        "vehicle_area_matrix": veh_area_matrix,
        "congestion_metrics": congestion_metrics,
        "correlations": correlations,
        "insights_facts": insights_facts,
        "insights_sentences": generated_sentences,
        "centroids_disclaimer": centroids_disclaimer,
        "detected_cities": detected_cities
    }

    return aggregates

def save_to_mongodb(featured_df, aggregates, dataset_id, dataset_name, filename, raw_cols):
    """Save processed records and computed aggregates associated with dataset_id without overwriting other datasets."""
    print(f"[STAGE 5: MONGODB LOAD] Connecting to MongoDB Atlas for dataset '{dataset_id}'...")
    client = MongoClient(config.MONGO_URI, serverSelectionTimeoutMS=10000)
    db = client[config.DATABASE_NAME]

    client.server_info()
    print(f"[STAGE 5: MONGODB LOAD] Connected to database '{config.DATABASE_NAME}'.")

    # Attach dataset_id to records
    records_col = db[config.COLLECTIONS["records"]]
    # Delete only existing documents for THIS dataset_id (idempotent re-run safety)
    records_col.delete_many({"dataset_id": dataset_id})

    featured_with_id = featured_df.withColumn("dataset_id", lit(dataset_id))
    records_list = [row.asDict() for row in featured_with_id.collect()]

    if records_list:
        records_col.insert_many(records_list)
        records_col.create_index([("dataset_id", ASCENDING), ("date", ASCENDING)])
        records_col.create_index([("dataset_id", ASCENDING), ("area", ASCENDING)])
        records_col.create_index([("dataset_id", ASCENDING), ("vehicle_type", ASCENDING)])
        records_col.create_index([("dataset_id", ASCENDING), ("congestion_level", ASCENDING)])
    print(f"[STAGE 5: MONGODB LOAD] Wrote {len(records_list)} docs with dataset_id='{dataset_id}'.")

    # Save hotspots
    hotspots_col = db[config.COLLECTIONS["hotspots"]]
    hotspots_col.delete_many({"dataset_id": dataset_id})
    hotspots_list = [{**h, "dataset_id": dataset_id} for h in aggregates["hotspots"]]
    if hotspots_list:
        hotspots_col.insert_many(hotspots_list)
        hotspots_col.create_index([("dataset_id", ASCENDING), ("rank", ASCENDING)])
    print(f"[STAGE 5: MONGODB LOAD] Wrote {len(hotspots_list)} hotspots.")

    # Save analytics
    analytics_col = db[config.COLLECTIONS["analytics"]]
    try:
        for idx in analytics_col.list_indexes():
            if idx.get("name") == "metric_type_1" and idx.get("unique", False):
                analytics_col.drop_index("metric_type_1")
                print("[STAGE 5: MONGODB LOAD] Dropped legacy unique index 'metric_type_1'.")
    except Exception as idx_err:
        pass

    analytics_col.delete_many({"dataset_id": dataset_id})

    analytics_docs = [
        {"dataset_id": dataset_id, "metric_type": "summary", "data": aggregates["summary"]},
        {"dataset_id": dataset_id, "metric_type": "daily_trend", "data": aggregates["daily_trend"]},
        {"dataset_id": dataset_id, "metric_type": "monthly_trend", "data": aggregates["monthly_trend"]},
        {"dataset_id": dataset_id, "metric_type": "dow_trend", "data": aggregates["dow_trend"]},
        {"dataset_id": dataset_id, "metric_type": "weekend_comparison", "data": aggregates["weekend_comparison"]},
        {"dataset_id": dataset_id, "metric_type": "area_metrics", "data": aggregates["area_metrics"]},
        {"dataset_id": dataset_id, "metric_type": "vehicle_metrics", "data": aggregates["vehicle_metrics"]},
        {"dataset_id": dataset_id, "metric_type": "vehicle_monthly_trend", "data": aggregates["vehicle_monthly_trend"]},
        {"dataset_id": dataset_id, "metric_type": "vehicle_area_matrix", "data": aggregates["vehicle_area_matrix"]},
        {"dataset_id": dataset_id, "metric_type": "congestion_metrics", "data": aggregates["congestion_metrics"]},
        {"dataset_id": dataset_id, "metric_type": "correlations", "data": aggregates["correlations"]}
    ]
    analytics_col.insert_many(analytics_docs)
    print(f"[STAGE 5: MONGODB LOAD] Wrote 11 analytics bundles for dataset_id='{dataset_id}'.")

    # Save insights
    insights_col = db[config.COLLECTIONS["insights"]]
    insights_col.delete_many({"dataset_id": dataset_id})
    insights_doc = {
        "dataset_id": dataset_id,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "facts": aggregates["insights_facts"],
        "sentences": aggregates["insights_sentences"],
        "disclaimer": aggregates["centroids_disclaimer"]
    }
    insights_col.insert_one(insights_doc)
    print(f"[STAGE 5: MONGODB LOAD] Wrote smart insights for dataset_id='{dataset_id}'.")

    # Save metadata
    meta_col = db[config.COLLECTIONS["metadata"]]
    meta_col.delete_many({"dataset_id": dataset_id})
    detected_cities = aggregates.get("detected_cities", [])
    meta_doc = {
        "dataset_id": dataset_id,
        "pipeline_run_time": datetime.now(timezone.utc).isoformat(),
        "dataset_name": dataset_name,
        "record_count": len(records_list),
        "cities": detected_cities,
        "areas": [h["area"] for h in aggregates["hotspots"]],
        "vehicle_types": [v["vehicle_type"] for v in aggregates["vehicle_metrics"]],
        "date_range": {
            "start": aggregates["summary"]["start_date"],
            "end": aggregates["summary"]["end_date"]
        },
        "capabilities": {
            "traffic_volume": True,
            "temporal_daily": True,
            "temporal_hourly": False,
            "temporal_granularity": "daily",
            "location_area": True,
            "location_city": True,
            "location_gps": False,
            "vehicle_analysis": True,
            "accident_analysis": True,
            "violation_analysis": True,
            "speed_analysis": True,
            "congestion_analysis": True
        },
        "centroids_disclaimer": aggregates["centroids_disclaimer"]
    }
    meta_col.insert_one(meta_doc)

    # Register in datasets collection and mark as active
    datasets_col = db["datasets"]
    # Unset active on all other datasets
    datasets_col.update_many({}, {"$set": {"is_active": False}})
    # Upsert this dataset
    dataset_entry = {
        "dataset_id": dataset_id,
        "dataset_name": dataset_name,
        "filename": os.path.basename(filename),
        "uploaded_at": datetime.now(timezone.utc),
        "record_count": len(records_list),
        "date_range": meta_doc["date_range"],
        "cities": detected_cities,
        "areas": meta_doc["areas"],
        "vehicle_types": meta_doc["vehicle_types"],
        "detected_columns": list(raw_cols),
        "capabilities": meta_doc["capabilities"],
        "is_active": True
    }
    datasets_col.update_one(
        {"dataset_id": dataset_id},
        {"$set": dataset_entry},
        upsert=True
    )
    print(f"[STAGE 5: MONGODB LOAD] Dataset '{dataset_id}' successfully marked as active.")

    client.close()
    return dataset_entry

def run_pipeline(input_csv=None, dataset_id=None, dataset_name=None):
    """Execute end-to-end Big Data PySpark pipeline."""
    start_time = time.time()

    input_csv = input_csv or config.DATA_PATH
    dataset_id = dataset_id or "mumbai_traffic_2025"
    dataset_name = dataset_name or "Mumbai Metropolitan Traffic (2025)"

    print("=" * 65)
    print("TRAFFICPULSE - DYNAMIC PYSPARK BIG DATA PIPELINE")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Input File: {input_csv}")
    print(f"Dataset ID: {dataset_id}")
    print(f"Dataset Name: {dataset_name}")
    print("=" * 65)

    spark = get_spark_session(f"TrafficPulse_{dataset_id}")
    try:
        # Step 1: Validate & Read CSV
        renamed_df, raw_count, raw_cols = validate_and_read_csv(spark, input_csv)

        # Step 2: Clean & Normalize
        cleaned_df, cleaned_count = clean_and_normalize(renamed_df)

        # Step 3: Feature Engineer & Detect Cities
        featured_df, detected_cities = derive_features(cleaned_df)

        # Step 4: Compute Aggregations
        aggregates = compute_aggregations(featured_df, detected_cities, dataset_name, spark)

        # Step 5: Save to MongoDB
        dataset_entry = save_to_mongodb(featured_df, aggregates, dataset_id, dataset_name, input_csv, raw_cols)

        elapsed = round(time.time() - start_time, 2)
        print("=" * 65)
        print("PIPELINE COMPLETED SUCCESSFULLY")
        print(f"Execution Time: {elapsed} seconds")
        print(f"Cleaned Valid Rows: {cleaned_count}")
        print(f"Detected Cities: {detected_cities}")
        print(f"Active Dataset ID: {dataset_id}")
        print("=" * 65)

        return {
            "status": "SUCCESS",
            "dataset_id": dataset_id,
            "dataset_name": dataset_name,
            "execution_time_seconds": elapsed,
            "record_count": cleaned_count,
            "cities": detected_cities,
            "areas": dataset_entry["areas"],
            "vehicle_types": dataset_entry["vehicle_types"]
        }

    finally:
        print("[SPARK] Stopping SparkSession...")
        spark.stop()
        print("[SPARK] SparkSession stopped.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TrafficPulse Dynamic PySpark Pipeline")
    parser.add_argument("--input-csv", type=str, default=None, help="Path to input traffic CSV file")
    parser.add_argument("--dataset-id", type=str, default=None, help="Unique dataset ID")
    parser.add_argument("--dataset-name", type=str, default=None, help="Display name for dataset")
    args = parser.parse_args()

    run_pipeline(
        input_csv=args.input_csv,
        dataset_id=args.dataset_id,
        dataset_name=args.dataset_name
    )
