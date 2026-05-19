import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("Searching for table 'profiles' across all schemas:")
cur.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%profile%'")
for row in cur.fetchall():
    print(row)

conn.close()
