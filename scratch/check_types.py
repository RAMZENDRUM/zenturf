import psycopg2
db_url = "postgresql://postgres.yhpljnemmdahavtlwzbg:RAMCLAUDE2007%40@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(db_url)
cur = conn.cursor()
cur.execute("SELECT n.nspname as schema, t.typname as type FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public'")
types = cur.fetchall()
for t in types:
    print(t)
conn.close()
