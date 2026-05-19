import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
conn = psycopg2.connect(db_url)
cur = conn.cursor()
cur.execute("SELECT count(*), type FROM public.zenturf_venues_v2 GROUP BY type")
print(cur.fetchall())
cur.execute("SELECT id, name, type, photos FROM public.zenturf_venues_v2 LIMIT 5")
for r in cur.fetchall():
    print(r)
cur.close()
conn.close()
