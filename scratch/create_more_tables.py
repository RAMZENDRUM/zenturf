import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

def create_other_tables():
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    print("Creating other zenturf tables...", flush=True)

    # 1. Bookings
    cur.execute("""
        CREATE TABLE IF NOT EXISTS public.zenturf_bookings_v2 (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL,
            venue_id uuid NOT NULL REFERENCES public.zenturf_venues_v2(id) ON DELETE CASCADE,
            slot_id uuid NOT NULL UNIQUE REFERENCES public.zenturf_slots_v2(id) ON DELETE CASCADE,
            sport_type text,
            booking_date date NOT NULL,
            start_time time NOT NULL,
            end_time time NOT NULL,
            total_price numeric NOT NULL,
            payment_status text NOT NULL DEFAULT 'pending',
            payment_id text,
            booking_ref text NOT NULL UNIQUE DEFAULT ('VB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
            qr_code_data text,
            group_members jsonb NOT NULL DEFAULT '[]'::jsonb,
            status text NOT NULL DEFAULT 'confirmed',
            cancellation_reason text,
            refund_amount numeric NOT NULL DEFAULT 0,
            created_at timestamptz NOT NULL DEFAULT now()
        );
    """)

    # 2. Notifications
    cur.execute("""
        CREATE TABLE IF NOT EXISTS public.zenturf_notifications_v2 (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL,
            type text NOT NULL,
            message text NOT NULL,
            is_read boolean NOT NULL DEFAULT false,
            created_at timestamptz NOT NULL DEFAULT now()
        );
    """)

    # 3. Reviews
    cur.execute("""
        CREATE TABLE IF NOT EXISTS public.zenturf_reviews_v2 (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL,
            venue_id uuid NOT NULL REFERENCES public.zenturf_venues_v2(id) ON DELETE CASCADE,
            booking_id uuid UNIQUE REFERENCES public.zenturf_bookings_v2(id) ON DELETE SET NULL,
            rating int NOT NULL,
            comment text,
            created_at timestamptz NOT NULL DEFAULT now()
        );
    """)

    # 4. Favourites
    cur.execute("""
        CREATE TABLE IF NOT EXISTS public.zenturf_favourites_v2 (
            user_id uuid NOT NULL,
            venue_id uuid NOT NULL REFERENCES public.zenturf_venues_v2(id) ON DELETE CASCADE,
            created_at timestamptz NOT NULL DEFAULT now(),
            PRIMARY KEY (user_id, venue_id)
        );
    """)

    # Enable RLS on all
    for table in ["zenturf_bookings_v2", "zenturf_notifications_v2", "zenturf_reviews_v2", "zenturf_favourites_v2"]:
        cur.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;")
        cur.execute(f"DROP POLICY IF EXISTS \"Public access {table}\" ON public.{table};")
        cur.execute(f"CREATE POLICY \"Public access {table}\" ON public.{table} FOR ALL USING (true);")

    conn.commit()
    cur.close()
    conn.close()
    print("Done!", flush=True)

if __name__ == "__main__":
    create_other_tables()
