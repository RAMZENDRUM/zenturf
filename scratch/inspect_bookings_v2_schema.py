import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("Listing column definitions for zenturf_bookings_v2:")
cur.execute("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'zenturf_bookings_v2'")
for row in cur.fetchall():
    print(row)

print("\nListing constraints for zenturf_bookings_v2:")
cur.execute("""
    SELECT conname, pg_get_constraintdef(c.oid) 
    FROM pg_constraint c 
    JOIN pg_namespace n ON n.oid = c.connamespace 
    WHERE conrelid = 'zenturf_bookings_v2'::regclass
""")
for row in cur.fetchall():
    print(row)

conn.close()
