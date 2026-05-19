import urllib.request
import re
import urllib.parse

def fetch_unsplash_ids(query):
    url = f"https://unsplash.com/s/photos/{urllib.parse.quote(query)}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            # Look for photo URLs like https://images.unsplash.com/photo-1574629810360-7efbbe195018 or similar
            matches = re.findall(r'https://images\.unsplash\.com/photo-([a-zA-Z0-9\-]+)', html)
            # Filter matches to unique and reasonable length (e.g. 10 to 30 characters)
            unique_ids = []
            for m in matches:
                # Remove query params or trailing stuff if any
                clean_id = m.split('?')[0]
                if clean_id not in unique_ids and len(clean_id) > 10:
                    unique_ids.append(clean_id)
            return unique_ids
    except Exception as e:
        print(f"Error fetching for query {query}: {e}")
        return []

if __name__ == "__main__":
    queries = ["soccer-turf", "badminton-court", "basketball-court", "auditorium", "cricket-ground", "tennis-court", "squash-court", "banquet-hall"]
    for q in queries:
        ids = fetch_unsplash_ids(q)
        print(f"{q}: {len(ids)} ids found")
        print(ids[:15])
