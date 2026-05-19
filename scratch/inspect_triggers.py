import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("Listing triggers on zenturf_bookings_v2:")
cur.execute("""
    SELECT tgname, pg_get_triggerdef(t.oid) 
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'zenturf_bookings_v2'
""")
for row in cur.fetchall():
    print(row)

conn.close()
