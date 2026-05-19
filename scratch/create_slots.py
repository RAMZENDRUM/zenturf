import os
import psycopg2
import datetime
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

def create_slots():
    print("Starting slot creation...", flush=True)
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # 1. Create slots table
    print("Creating table zenturf_slots_v2...", flush=True)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS public.zenturf_slots_v2 (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            venue_id uuid NOT NULL,
            date date NOT NULL,
            start_time time NOT NULL,
            end_time time NOT NULL,
            is_booked boolean NOT NULL DEFAULT false,
            booked_by uuid,
            price_override numeric,
            UNIQUE (venue_id, date, start_time)
        );
    """)
    conn.commit() # Commit after creation

    # 2. Enable RLS
    print("Enabling RLS...", flush=True)
    cur.execute("ALTER TABLE public.zenturf_slots_v2 ENABLE ROW LEVEL SECURITY;")
    cur.execute("DROP POLICY IF EXISTS \"Public view zenturf_slots_v2\" ON public.zenturf_slots_v2;")
    cur.execute("CREATE POLICY \"Public view zenturf_slots_v2\" ON public.zenturf_slots_v2 FOR SELECT USING (true);")
    conn.commit()

    # 3. Get all venue IDs
    print("Fetching venue IDs...", flush=True)
    cur.execute("SELECT id FROM public.zenturf_venues_v2")
    venue_ids = [r[0] for r in cur.fetchall()]
    print(f"Found {len(venue_ids)} venues.", flush=True)

    # 4. Generate slots for the next 7 days
    print(f"Generating slots for {len(venue_ids)} venues...", flush=True)
    today = datetime.date.today()
    slots = []
    for v_id in venue_ids:
        for i in range(7):
            date = today + datetime.timedelta(days=i)
            # 6 AM to 10 PM
            for hour in range(6, 22):
                start_time = f"{hour:02d}:00:00"
                end_time = f"{(hour+1):02d}:00:00"
                slots.append((v_id, date, start_time, end_time))

    print(f"Inserting {len(slots)} slots in batches of 100...", flush=True)
    count = 0
    for i in range(0, len(slots), 100):
        batch = slots[i:i+100]
        values_str = ",".join(cur.mogrify("(%s, %s, %s, %s)", x).decode("utf-8") for x in batch)
        cur.execute(f"INSERT INTO public.zenturf_slots_v2 (venue_id, date, start_time, end_time) VALUES {values_str} ON CONFLICT DO NOTHING")
        conn.commit()
        count += len(batch)
        if count % 1000 == 0:
            print(f"Inserted {count} slots...", flush=True)

    cur.close()
    conn.close()
    print("Done!", flush=True)

if __name__ == "__main__":
    create_slots()
