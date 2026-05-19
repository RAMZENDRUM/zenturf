import urllib.request
import re
import urllib.parse
import time

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
}

def get_pexels_ids(query, count=25):
    # Try different search terms if needed, by default just search the query
    encoded = urllib.parse.quote(query)
    url = f"https://www.pexels.com/search/{encoded}/"
    print(f"Searching Pexels for '{query}': {url}", flush=True)
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            html = res.read().decode('utf-8')
            # Extract pexels photo IDs
            ids = re.findall(r'images\.pexels\.com/photos/(\d+)/', html)
            # Retain order, unique IDs
            unique_ids = []
            for i in ids:
                if i not in unique_ids:
                    unique_ids.append(i)
            print(f"Found {len(unique_ids)} candidates for '{query}'", flush=True)
            
            # Verify they return 200
            verified = []
            for pid in unique_ids:
                if len(verified) >= count:
                    break
                test_url = f"https://images.pexels.com/photos/{pid}/pexels-photo-{pid}.jpeg?auto=compress&cs=tinysrgb&w=800"
                test_req = urllib.request.Request(test_url, headers=headers, method='GET')
                try:
                    with urllib.request.urlopen(test_req, timeout=3) as test_res:
                        if test_res.status == 200:
                            verified.append(pid)
                            print(f"  [OK] {pid}", flush=True)
                except Exception:
                    pass
                time.sleep(0.05)
            return verified
    except Exception as e:
        print(f"Failed to fetch search page for '{query}': {e}", flush=True)
        return []

if __name__ == "__main__":
    print("--- STARTING PEXELS PHOTO ACQUISITION ---", flush=True)
    
    # 1. Football Turf (using "soccer field", "football field")
    football_candidates = get_pexels_ids("soccer field", 12) + get_pexels_ids("football field", 12)
    # De-duplicate
    football_ids = list(dict.fromkeys(football_candidates))
    print(f"Total Football Turf IDs: {len(football_ids)}", flush=True)
    print("FOOTBALL_PEXELS =", football_ids)
    
    # 2. Courts (using "badminton", "basketball court", "tennis court")
    court_candidates = get_pexels_ids("badminton", 10) + get_pexels_ids("basketball court", 10) + get_pexels_ids("tennis court", 10)
    court_ids = list(dict.fromkeys(court_candidates))
    print(f"Total Court IDs: {len(court_ids)}", flush=True)
    print("COURT_PEXELS =", court_ids)
    
    # 3. Auditorium (using "auditorium", "seminar hall", "lecture hall")
    aud_candidates = get_pexels_ids("auditorium", 12) + get_pexels_ids("seminar hall", 12)
    aud_ids = list(dict.fromkeys(aud_candidates))
    print(f"Total Auditorium IDs: {len(aud_ids)}", flush=True)
    print("AUDITORIUM_PEXELS =", aud_ids)
