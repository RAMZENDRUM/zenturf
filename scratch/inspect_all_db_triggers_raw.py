import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("User-defined triggers in public schema:")
cur.execute("""
    SELECT event_object_table, trigger_name, action_statement
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' AND trigger_name NOT LIKE 'RI_ConstraintTrigger%'
""")
for row in cur.fetchall():
    print(row)

conn.close()
