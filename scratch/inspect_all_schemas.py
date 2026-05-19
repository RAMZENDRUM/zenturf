import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'profiles'")
rows = cur.fetchall()
print("Profiles table locations:")
for r in rows:
    print(r)
conn.close()
