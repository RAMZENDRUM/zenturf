import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("Listing all triggers in public schema:")
cur.execute("""
    SELECT event_object_table, trigger_name 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public'
""")
for row in cur.fetchall():
    print(row)

conn.close()
