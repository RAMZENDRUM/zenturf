import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("Listing functions:")
cur.execute("""
    SELECT proname, pg_get_functiondef(p.oid)
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
""")
for row in cur.fetchall():
    print(f"Function: {row[0]}")
    # print(row[1])

conn.close()
