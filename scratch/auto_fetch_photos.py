import urllib.request
import re
import urllib.parse
import time

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive'
}

def get_verified_photos(query, count=20):
    encoded_query = urllib.parse.quote(query)
    url = f"https://unsplash.com/s/photos/{encoded_query}"
    print(f"Scraping '{query}' from: {url}", flush=True)
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8')
    except Exception as e:
        print(f"Error loading search page for '{query}': {e}", flush=True)
        return []
    
    # Extract photo IDs. Unsplash photos follow pattern: images.unsplash.com/photo-1574629810360-7efbbe195018
    # The ID part is photo-[timestamp]-[hex]
    photo_ids = re.findall(r'images\.unsplash\.com/(photo-[0-9a-zA-Z\-]+)', html)
    # De-duplicate
    unique_ids = []
    for pid in photo_ids:
        # Extract just the main ID (remove parameters if any)
        clean_id = pid.split('?')[0]
        # In Unsplash, photo IDs are like photo-123456789-abcdef123456. Make sure it matches this structure.
        if len(clean_id) > 10 and clean_id not in unique_ids:
            unique_ids.append(clean_id)
            
    print(f"Found {len(unique_ids)} candidate photo IDs for '{query}'", flush=True)
    
    verified_ids = []
    for pid in unique_ids:
        if len(verified_ids) >= count:
            break
        test_url = f"https://images.unsplash.com/{pid}?auto=format&fit=crop&q=80&w=800"
        test_req = urllib.request.Request(test_url, headers=headers, method='GET')
        try:
            # Short timeout to keep verification quick
            with urllib.request.urlopen(test_req, timeout=3) as res:
                if res.status == 200:
                    # Strip 'photo-' prefix to get the raw ID
                    raw_id = pid.replace('photo-', '')
                    verified_ids.append(raw_id)
                    print(f"  VERIFIED: {raw_id}", flush=True)
        except Exception as e:
            # Failed to load, skip it
            pass
        time.sleep(0.1) # Small delay
        
    return verified_ids

if __name__ == "__main__":
    # Test it
    turfs = get_verified_photos("soccer turf", 5)
    print("Turfs verified:", turfs)
