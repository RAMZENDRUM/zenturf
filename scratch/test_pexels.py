import urllib.request
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
}

url = "https://www.pexels.com/search/soccer/"
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=5) as res:
        html = res.read().decode('utf-8')
        print(f"Status: {res.status}")
        # Search for pexels image URLs: images.pexels.com/photos/1141853/pexels-photo-1141853.jpeg
        matches = re.findall(r'images\.pexels\.com/photos/(\d+)/', html)
        print(f"Found matches: {set(matches)}")
except Exception as e:
    print(f"FAILED: {e}")
