import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
conn = psycopg2.connect(db_url)
cur = conn.cursor()

# Get all venues and their primary photo URL
cur.execute("SELECT id, name, type, photos FROM public.zenturf_venues_v2")
rows = cur.fetchall()

primary_photos = []
all_photos = []
duplicates_primary = 0
duplicates_all = 0

print(f"Verifying {len(rows)} venues for photo uniqueness...")
for r in rows:
    v_id, name, v_type, photos = r
    if not photos:
        print(f"WARNING: Venue {name} has no photos!")
        continue
    primary = photos[0]
    
    # Check if primary is duplicate
    if primary in primary_photos:
        duplicates_primary += 1
        # Find which venue had this primary photo before
        prev_idx = primary_photos.index(primary)
        prev_name = rows[prev_idx][1]
        print(f"Duplicate Primary Photo: '{name}' shares primary photo with '{prev_name}'")
    primary_photos.append(primary)
    
    # Check if all photos have duplicates
    for p in photos:
        if p in all_photos:
            duplicates_all += 1
        all_photos.append(p)

print("\n--- RESULTS ---")
print(f"Total Venues: {len(rows)}")
print(f"Total Primary Photos: {len(primary_photos)}")
print(f"Unique Primary Photos: {len(set(primary_photos))}")
print(f"Duplicate Primary Photos count: {duplicates_primary}")
print(f"Total Photo URLs assigned: {len(all_photos)}")
print(f"Unique Photo URLs assigned: {len(set(all_photos))}")

cur.close()
conn.close()
