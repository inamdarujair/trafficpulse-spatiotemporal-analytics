import csv

input_path = "data/traffic_dataset.csv"

with open(input_path, "r", encoding="utf-8") as f:
    reader = list(csv.DictReader(f))
    fieldnames = reader[0].keys()

for city in ["Mumbai", "Pune", "Thane"]:
    city_rows = [r for r in reader if r["City"].strip().lower() == city.lower()]
    out_path = f"data/{city.lower()}_traffic.csv"
    with open(out_path, "w", newline="", encoding="utf-8") as f_out:
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(city_rows)
    print(f"Wrote {len(city_rows)} rows to {out_path}")
