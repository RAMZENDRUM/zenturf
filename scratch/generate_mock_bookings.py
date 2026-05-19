import os
import psycopg2
import random
import datetime
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

# 1. Get all profiles
cur.execute("SELECT id, name FROM public.profiles")
profiles = cur.fetchall()
if not profiles:
    print("No profiles found to assign bookings to!")
    conn.close()
    exit(0)

# 2. Get some venues
cur.execute("SELECT id, name, type, price_per_hour, sport_tags FROM public.zenturf_venues_v2 LIMIT 5")
venues = cur.fetchall()
if not venues:
    print("No venues found! Please run manual_migrate.py first.")
    conn.close()
    exit(0)

# 3. Clean old bookings to avoid duplicate constraints on slot
print("Cleaning old bookings...")
cur.execute("DELETE FROM public.zenturf_bookings_v2")

today = datetime.date.today()

for p_id, p_name in profiles:
    print(f"Creating mock bookings for user {p_name} ({p_id})...")
    
    # Let's create:
    # 1. A past booking (yesterday)
    # 2. An upcoming booking (tomorrow)
    # 3. Another upcoming booking (in 3 days)
    
    dates = [
        (today - datetime.timedelta(days=1), "past"),
        (today + datetime.timedelta(days=1), "upcoming"),
        (today + datetime.timedelta(days=3), "upcoming")
    ]
    
    for date, b_type in dates:
        # Pick a random venue
        v_id, v_name, v_type, price, sports = random.choice(venues)
        sport = sports[0] if sports else "Sports"
        
        # Pick a slot for this date and venue
        cur.execute(
            "SELECT id, start_time, end_time FROM public.zenturf_slots_v2 WHERE venue_id = %s AND date = %s LIMIT 1",
            (v_id, date)
        )
        slot = cur.fetchone()
        if not slot:
            # Create a slot manually if it doesn't exist
            start_time = "17:00:00"
            end_time = "18:00:00"
            cur.execute("""
                INSERT INTO public.zenturf_slots_v2 (venue_id, date, start_time, end_time, is_booked)
                VALUES (%s, %s, %s, %s, true)
                RETURNING id
            """, (v_id, date, start_time, end_time))
            slot_id = cur.fetchone()[0]
        else:
            slot_id, start_time, end_time = slot
            # Mark the slot as booked
            cur.execute(
                "UPDATE public.zenturf_slots_v2 SET is_booked = true WHERE id = %s",
                (slot_id,)
            )
            
        # Insert booking
        ref_num = random.randint(10000000, 99999999)
        booking_ref = f"VB-{ref_num:X}"
        qr = f'{{"ref": "{booking_ref}", "id": "{slot_id}"}}'
        payment_id = f"ZP-MOCK-{random.randint(100000, 999999)}"
        
        cur.execute("""
            INSERT INTO public.zenturf_bookings_v2 (
                booking_ref, user_id, venue_id, slot_id, sport_type, 
                booking_date, start_time, end_time, total_price, 
                status, payment_status, qr_code_data, payment_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'confirmed', 'paid', %s, %s)
        """, (booking_ref, p_id, v_id, slot_id, sport, date, start_time, end_time, price, qr, payment_id))

print("Successfully generated gorgeous mock bookings!")
conn.close()
