import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("Listing all bookings:")
cur.execute("SELECT id, booking_ref, user_id, venue_id, booking_date, start_time, end_time, total_price, status, payment_status FROM public.zenturf_bookings_v2")
for row in cur.fetchall():
    print(row)

print("\nListing notifications:")
cur.execute("SELECT id, user_id, type, message FROM public.zenturf_notifications_v2")
for row in cur.fetchall():
    print(row)

conn.close()
