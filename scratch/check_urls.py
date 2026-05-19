import os
import psycopg2
import urllib.request
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute("SELECT id, name, photos FROM public.zenturf_venues_v2")
rows = cur.fetchall()

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
}

print(f"Checking {len(rows)} venues' photo URLs...", flush=True)
for r in rows:
    v_id, name, photos = r
    print(f"\nVenue: {name}", flush=True)
    for p in photos:
        # Use GET instead of HEAD in case HEAD is blocked, and add timeout
        req = urllib.request.Request(p, headers=headers, method='GET')
        try:
            with urllib.request.urlopen(req, timeout=3) as res:
                print(f"  URL: {p} -> {res.status}", flush=True)
        except Exception as e:
            print(f"  URL: {p} -> FAILED: {e}", flush=True)

cur.close()
conn.close()
