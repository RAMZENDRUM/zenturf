import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

# 1. Create profiles table if it doesn't exist
print("Creating/altering profiles table...")
cur.execute("""
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  name text,
  phone text,
  email text,
  avatar_url text,
  wallet_credits numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
""")

# 2. Add new columns if they do not exist
columns_to_add = [
    ("age", "integer"),
    ("place", "text"),
    ("interested_sports", "text[]")
]

for col_name, col_type in columns_to_add:
    cur.execute(f"""
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='{col_name}';
    """)
    if not cur.fetchone():
        print(f"Adding column '{col_name}' ({col_type})...")
        cur.execute(f"ALTER TABLE public.profiles ADD COLUMN {col_name} {col_type};")
    else:
        print(f"Column '{col_name}' already exists.")

# 3. Enable RLS and setup policies
print("Enabling RLS on profiles...")
cur.execute("ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;")

# Drop old policies if they exist to recreate them safely
policies = [
    "Profiles are viewable by everyone",
    "Users can update own profile",
    "Users can insert own profile"
]
for p in policies:
    cur.execute(f"DROP POLICY IF EXISTS \"{p}\" ON public.profiles;")

print("Creating policies...")
cur.execute("""
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
""")
cur.execute("""
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
""")
cur.execute("""
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
""")

# 4. Handle new user trigger function
print("Setting up handle_new_user function and trigger...")
cur.execute("""
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user') ON CONFLICT DO NOTHING;

  RETURN new;
END;
$$;
""")

cur.execute("DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;")
cur.execute("""
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
""")

print("Profiles table setup complete!")
conn.close()
