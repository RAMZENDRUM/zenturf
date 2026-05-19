import urllib.request

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
}

url = "https://images.unsplash.com/photo-1626224580175-340adc133a0c"
req = urllib.request.Request(url, headers=headers, method='GET')
try:
    with urllib.request.urlopen(req, timeout=5) as res:
        print(f"URL: {url} -> Status: {res.status}")
except Exception as e:
    print(f"URL: {url} -> FAILED: {e}")
