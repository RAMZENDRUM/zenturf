import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
conn = psycopg2.connect(db_url)
cur = conn.cursor()
cur.execute("""
    CREATE TABLE IF NOT EXISTS public.zenturf_waitlist_v2 (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        venue_id uuid NOT NULL REFERENCES public.zenturf_venues_v2(id) ON DELETE CASCADE,
        slot_id uuid REFERENCES public.zenturf_slots_v2(id) ON DELETE CASCADE,
        notified boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
    )
""")
cur.execute("ALTER TABLE public.zenturf_waitlist_v2 ENABLE ROW LEVEL SECURITY")
cur.execute("DROP POLICY IF EXISTS \"Public access zenturf_waitlist_v2\" ON public.zenturf_waitlist_v2")
cur.execute("CREATE POLICY \"Public access zenturf_waitlist_v2\" ON public.zenturf_waitlist_v2 FOR ALL USING (true)")
conn.commit()
conn.close()
