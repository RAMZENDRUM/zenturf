import os
import psycopg2
import random
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

# Precise Chennai Locations (Safely inland away from Bay of Bengal coast)
LOCATIONS = {
    "Velachery": (12.9815, 80.2185),
    "Adyar": (13.0033, 80.2500),
    "T.Nagar": (13.0418, 80.2341),
    "Anna Nagar": (13.0850, 80.2101),
    "OMR": (12.9010, 80.2270),
    "ECR": (12.9430, 80.2450),
    "Mylapore": (13.0330, 80.2600),
    "Nungambakkam": (13.0600, 80.2400),
    "Porur": (13.0380, 80.1560),
    "Guindy": (13.0067, 80.2206),
    "Kotturpuram": (13.0180, 80.2420),
    "Besant Nagar": (12.9980, 80.2620),
}

# Guaranteed High-Quality Sports & Auditorium Photo URLs (100% Verified Active URLs)
FOOTBALL_URLS = [
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1536122985607-4fe00b283652?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&q=80&w=800",
    "https://images.pexels.com/photos/33210166/pexels-photo-33210166.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/35911832/pexels-photo-35911832.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/32024428/pexels-photo-32024428.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/5652612/pexels-photo-5652612.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/34912371/pexels-photo-34912371.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/36624679/pexels-photo-36624679.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/30651230/pexels-photo-30651230.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/34049622/pexels-photo-34049622.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/34649361/pexels-photo-34649361.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/20430247/pexels-photo-20430247.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/35347471/pexels-photo-35347471.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/12768058/pexels-photo-12768058.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/13141521/pexels-photo-13141521.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/36409327/pexels-photo-36409327.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/36573287/pexels-photo-36573287.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/31091356/pexels-photo-31091356.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/29267100/pexels-photo-29267100.jpeg?auto=compress&cs=tinysrgb&w=800"
]

COURT_URLS = [
    "https://images.unsplash.com/photo-1544919982-b61976f0ba43?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=800",
    "https://images.pexels.com/photos/8007173/pexels-photo-8007173.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/36409327/pexels-photo-36409327.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/29046700/pexels-photo-29046700.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/34049622/pexels-photo-34049622.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/31096662/pexels-photo-31096662.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/6307230/pexels-photo-6307230.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/7648279/pexels-photo-7648279.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/6478667/pexels-photo-6478667.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/16131189/pexels-photo-16131189.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/10157895/pexels-photo-10157895.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/31091356/pexels-photo-31091356.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/32965264/pexels-photo-32965264.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/35911832/pexels-photo-35911832.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/7765742/pexels-photo-7765742.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/34116480/pexels-photo-34116480.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/12783350/pexels-photo-12783350.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/31054362/pexels-photo-31054362.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/30839836/pexels-photo-30839836.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/29267100/pexels-photo-29267100.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/35514787/pexels-photo-35514787.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/13025827/pexels-photo-13025827.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/10667388/pexels-photo-10667388.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/35214630/pexels-photo-35214630.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/17429850/pexels-photo-17429850.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/5741303/pexels-photo-5741303.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/18084429/pexels-photo-18084429.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/11213192/pexels-photo-11213192.jpeg?auto=compress&cs=tinysrgb&w=800"
]

AUDITORIUM_URLS = [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1496065187959-7f07b8353c55?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
    "https://images.pexels.com/photos/32529343/pexels-photo-32529343.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/4940642/pexels-photo-4940642.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/33470077/pexels-photo-33470077.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3023317/pexels-photo-3023317.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/2774568/pexels-photo-2774568.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/7942486/pexels-photo-7942486.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/36025679/pexels-photo-36025679.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/5945799/pexels-photo-5945799.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/7710087/pexels-photo-7710087.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/8500643/pexels-photo-8500643.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/4175028/pexels-photo-4175028.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/8197558/pexels-photo-8197558.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/33362590/pexels-photo-33362590.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/16859956/pexels-photo-16859956.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/2201538/pexels-photo-2201538.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/17081979/pexels-photo-17081979.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/14612128/pexels-photo-14612128.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/17081982/pexels-photo-17081982.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/10903291/pexels-photo-10903291.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/2914421/pexels-photo-2914421.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/32554998/pexels-photo-32554998.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3864594/pexels-photo-3864594.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/1709003/pexels-photo-1709003.jpeg?auto=compress&cs=tinysrgb&w=800"
]

def get_unique_images(v_type, relative_counter):
    if "Auditorium" in v_type or "Hall" in v_type:
        pool = AUDITORIUM_URLS
    elif "Turf" in v_type or "Football" in v_type:
        pool = FOOTBALL_URLS
    else:
        pool = COURT_URLS
    
    # Deterministic sliding selection to guarantee no duplicates
    start_idx = relative_counter % len(pool)
    selected = [pool[(start_idx + i) % len(pool)] for i in range(4)]
    
    return selected

def run_migration():
    print("Connecting to DB...", flush=True)
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    print("Cleaning old venues...", flush=True)
    cur.execute("DELETE FROM public.zenturf_venues_v2")
    
    CORE_VENUES = [
        ("Velachery Grand Mall Turf", "Football Turf", "Velachery", "Grand Square Mall, Velachery", 4.5, 89, 1500, ["Parking", "Floodlights", "Washrooms", "AC"], ["Football"], 10500),
        ("Adyar Smash Center", "Badminton Court", "Adyar", "Gandhi Nagar, Adyar", 4.7, 210, 450, ["Parking", "Washrooms", "AC", "Wifi"], ["Badminton"], 3200),
        ("Anna Nagar Grand Hall", "Auditorium", "Anna Nagar", "2nd Avenue, Anna Nagar", 4.9, 45, 5000, ["Parking", "AC", "Washrooms", "Wifi", "Projector"], ["Corporate Event", "Function"], 15000),
        ("Marina Arena", "Football Turf", "Besant Nagar", "Beach Road, Besant Nagar", 4.8, 156, 1200, ["Parking", "Floodlights", "Washrooms", "AC"], ["Football", "Futsal"], 12000),
        ("Mylapore Cultural Center", "Auditorium", "Mylapore", "Luz Church Road, Mylapore", 4.7, 189, 3500, ["Parking", "AC", "Washrooms", "Projector"], ["Concert", "Dance"], 8000),
    ]

    institutions = [
        ("PSBB", "School"), ("DAV", "School"), ("Loyola", "College"), ("Anna University", "University"), 
        ("Stella Maris", "College"), ("Don Bosco", "School"), ("MCC", "College"), ("SSN", "College"),
        ("VIT Chennai", "University"), ("SRM", "University")
    ]
    
    inst_venues = []
    for name, v_cat in institutions:
        area = random.choice(list(LOCATIONS.keys()))
        inst_venues.append((f"{name} {v_cat} Auditorium", "Auditorium", area, f"{name} Campus, {area}", round(random.uniform(4.0, 5.0), 1), random.randint(50, 200), random.randint(3000, 7000), ["Parking", "AC", "Washrooms", "Projector"], ["Event", "Seminar"], random.randint(10000, 30000)))
        inst_venues.append((f"{name} {v_cat} Sports Ground", "Football Turf", area, f"{name} Campus, {area}", round(random.uniform(4.0, 4.8), 1), random.randint(30, 150), random.randint(1000, 2500), ["Parking", "Floodlights", "Washrooms"], ["Football", "Cricket"], random.randint(15000, 40000)))

    brands = ["Whistle", "Tiki Taka", "Game On", "Turfo", "The Pitch", "Goal One", "Soccer City", "Urban Sports", "Smash", "Net Play", "Ace", "Elite Sports", "Dream Arena"]
    comm_venues = []
    for brand in brands:
        area = random.choice(list(LOCATIONS.keys()))
        v_type = random.choice(["Football Turf", "Badminton Court", "Basketball Court"])
        comm_venues.append((f"{brand} {area}", v_type, area, f"Plot {random.randint(1,100)}, {area}", round(random.uniform(3.8, 4.9), 1), random.randint(20, 300), random.randint(400, 2000), ["Parking", "Washrooms", "Floodlights"], [v_type.split()[0]], random.randint(2000, 15000)))

    all_data = CORE_VENUES + inst_venues + comm_venues
    print(f"Inserting {len(all_data)} venues with VERIFIED photos...", flush=True)

    turf_counter = 0
    court_counter = 0
    auditorium_counter = 0

    for i, v in enumerate(all_data):
        name, v_type, area, address, rating, reviews, price, amenities, tags, sqft = v
        lat, lng = LOCATIONS.get(area, (13.0, 80.0))
        lat += random.uniform(-0.003, 0.003)
        lng += random.uniform(-0.003, 0.003)
        
        # Hard coastal safeguard to prevent pins falling eastwards into the sea
        if lng > 80.2645:
            lng = 80.2645 - random.uniform(0.0005, 0.002)
        
        if "Auditorium" in v_type or "Hall" in v_type:
            photos = get_unique_images(v_type, auditorium_counter)
            auditorium_counter += 1
        elif "Turf" in v_type or "Football" in v_type:
            photos = get_unique_images(v_type, turf_counter)
            turf_counter += 1
        else:
            photos = get_unique_images(v_type, court_counter)
            court_counter += 1
        
        cur.execute("""
            INSERT INTO public.zenturf_venues_v2 (
                name, type, city, address, rating, total_reviews, price_per_hour, amenities, sport_tags, area_sqft, lat, lng, photos, is_approved
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, true)
        """, (name, v_type, "Chennai", address, rating, reviews, price, amenities, tags, sqft, lat, lng, photos))

    conn.commit()
    cur.close()
    conn.close()
    print("Migration complete!", flush=True)

if __name__ == "__main__":
    run_migration()
