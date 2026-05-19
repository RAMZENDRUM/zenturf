import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("Listing all system triggers on zenturf tables:")
cur.execute("""
    SELECT c.relname, t.tgname, pg_get_triggerdef(t.oid)
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname LIKE 'zenturf_%'
""")
for row in cur.fetchall():
    print(f"Table: {row[0]} | Trigger: {row[1]}")
    print(f"Def: {row[2]}\n")

conn.close()
