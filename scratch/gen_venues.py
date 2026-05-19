import random

venues = []

areas = ["Adyar", "T. Nagar", "Anna Nagar", "Velachery", "OMR", "ECR", "Mylapore", "Nungambakkam", "Besant Nagar", "Kilpauk", "Vadapalani", "Perungudi", "Tambaram", "Guindy", "Alwarpet"]

amenities_list = ["Parking", "Water", "Washroom", "Locker Room", "Floodlights", "First Aid", "CCTV", "Power Backup", "Changing Room", "Waiting Area"]

images = {
    "turf": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800",
    "court": "https://images.unsplash.com/photo-1544919982-b61976f0ba43?auto=format&fit=crop&q=80&w=800",
    "auditorium": "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=800"
}

# Schools (15)
school_names = ["PSBB", "DAV", "St. Patrick's", "Loyola Matric", "SBOA", "Chinmaya Vidyalaya", "Chettinad Vidyashram", "Lady Andal", "Bala Vidya Mandir", "Vidya Mandir", "Don Bosco", "Good Shepherd", "Rosary Matric", "Sacred Heart", "MCC Matric"]
for i, name in enumerate(school_names):
    area = random.choice(areas)
    v_type = "auditorium" if i % 2 == 0 else "turf"
    v_name = f"{name} {area} {'Auditorium' if v_type == 'auditorium' else 'Ground'}"
    sqft = random.randint(5000, 15000)
    price_hr = 2000 if v_type == 'auditorium' else 1200
    price_day = price_hr * 10
    venues.append({
        "name": v_name,
        "type": v_type,
        "sport_tags": ["Event Hall", "Auditorium"] if v_type == 'auditorium' else ["Football", "Cricket", "Sports Ground"],
        "city": "Chennai",
        "address": f"{random.randint(1, 200)}, {area} Main Road",
        "lat": 13.0827 + random.uniform(-0.1, 0.1),
        "lng": 80.2707 + random.uniform(-0.1, 0.1),
        "price_per_hour": price_hr,
        "price_per_day": price_day,
        "area_sqft": sqft,
        "photos": [images[v_type]],
        "amenities": random.sample(amenities_list, 5),
        "description": f"Spacious {v_type} at {name}. Available for school events, functions, and sports. Minimum booking 3 hours for {v_type}."
    })

# Colleges (15)
college_names = ["IIT Madras", "Anna University", "Loyola College", "Stella Maris", "Ethiraj", "MOP Vaishnav", "MCC", "SRM", "Hindustan", "SSN", "VIT Chennai", "Sathyabama", "Jeppiaar", "Saveetha", "Rajalakshmi"]
for i, name in enumerate(college_names):
    area = random.choice(areas)
    v_type = "auditorium" if i % 2 == 0 else "turf"
    v_name = f"{name} {area} {'Grand Hall' if v_type == 'auditorium' else 'Arena'}"
    sqft = random.randint(8000, 25000)
    price_hr = 3500 if v_type == 'auditorium' else 2000
    price_day = price_hr * 8
    venues.append({
        "name": v_name,
        "type": v_type,
        "sport_tags": ["Seminar", "Concert", "Event Hall"] if v_type == 'auditorium' else ["Cricket", "Football", "Athletics"],
        "city": "Chennai",
        "address": f"{name} Campus, {area}",
        "lat": 13.0827 + random.uniform(-0.1, 0.1),
        "lng": 80.2707 + random.uniform(-0.1, 0.1),
        "price_per_hour": price_hr,
        "price_per_day": price_day,
        "area_sqft": sqft,
        "photos": [images[v_type]],
        "amenities": random.sample(amenities_list, 6),
        "description": f"Premium {v_type} within {name} campus. Ideal for large gatherings or tournaments."
    })

# Turfs (10)
turf_brands = ["Tiki Taka", "Whistle", "Game On", "Turfo", "The Pitch", "Soccer City", "Goal One", "Sportyans", "Kick Off", "Urban Sports"]
for name in turf_brands:
    area = random.choice(areas)
    v_name = f"{name} {area}"
    sqft = random.randint(4000, 8000)
    price_hr = random.randint(1200, 2500)
    price_day = price_hr * 12
    venues.append({
        "name": v_name,
        "type": "turf",
        "sport_tags": ["Football", "Box Cricket"],
        "city": "Chennai",
        "address": f"Plot {random.randint(1, 50)}, {area} Industrial Estate",
        "lat": 13.0827 + random.uniform(-0.1, 0.1),
        "lng": 80.2707 + random.uniform(-0.1, 0.1),
        "price_per_hour": price_hr,
        "price_per_day": price_day,
        "area_sqft": sqft,
        "photos": [images["turf"]],
        "amenities": random.sample(amenities_list, 4),
        "description": f"Pro-grade FIFA certified turf at {name}. Available for matches and parties."
    })

# Courts (10)
court_brands = ["Smash", "Shuttle Court", "Pro Shuttle", "Net Play", "Ace", "Hoop Dreams", "Spin", "Volley Hub", "Squash Center", "Tennis Academy"]
for i, name in enumerate(court_brands):
    area = random.choice(areas)
    sport = "Badminton" if i % 2 == 0 else "Basketball"
    v_name = f"{name} {sport} {area}"
    sqft = random.randint(2000, 5000)
    price_hr = random.randint(400, 800)
    price_day = price_hr * 15
    venues.append({
        "name": v_name,
        "type": "court",
        "sport_tags": [sport, "Indoor"],
        "city": "Chennai",
        "address": f"{random.randint(1, 100)}, {area} Cross Street",
        "lat": 13.0827 + random.uniform(-0.1, 0.1),
        "lng": 80.2707 + random.uniform(-0.1, 0.1),
        "price_per_hour": price_hr,
        "price_per_day": price_day,
        "area_sqft": sqft,
        "photos": [images["court"] if sport == "Badminton" else "https://images.unsplash.com/photo-1519766304817-4f37bda74a27?auto=format&fit=crop&q=80&w=800"],
        "amenities": random.sample(amenities_list, 3),
        "description": f"High-quality {sport} court in {area}. Well ventilated and standard dimensions."
    })

# Generate SQL
sql = "INSERT INTO public.venues (name, type, sport_tags, city, address, lat, lng, price_per_hour, price_per_day, area_sqft, photos, amenities, description, is_approved, rating, total_reviews) VALUES \n"
rows = []
for v in venues:
    sport_tags_sql = "ARRAY['" + "','".join(v['sport_tags']) + "']"
    photos_sql = "ARRAY['" + "','".join(v['photos']) + "']"
    amenities_sql = "ARRAY['" + "','".join(v['amenities']) + "']"
    rating = round(random.uniform(3.5, 4.9), 1)
    reviews = random.randint(10, 500)
    row = f"('{v['name'].replace(\"'\", \"''\")}', '{v['type']}', {sport_tags_sql}, '{v['city']}', '{v['address'].replace(\"'\", \"''\")}', {v['lat']}, {v['lng']}, {v['price_per_hour']}, {v['price_per_day']}, {v['area_sqft']}, {photos_sql}, {amenities_sql}, '{v['description'].replace(\"'\", \"''\")}', true, {rating}, {reviews})"
    rows.append(row)

sql += ",\n".join(rows) + ";"

with open("d:/.gemini/zenturf-clean/supabase/migrations/20260514184200_seed_venues.sql", "w") as f:
    f.write(sql)
