import urllib.request
import json
import urllib.parse

def test_napi(query):
    encoded_query = urllib.parse.quote(query)
    url = f"https://unsplash.com/napi/search/photos?query={encoded_query}&per_page=30&page=1"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': f'https://unsplash.com/s/photos/{encoded_query}'
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            results = data.get('results', [])
            print(f"Query '{query}': Found {len(results)} photos")
            for i, photo in enumerate(results[:5]):
                print(f"  {i+1}. ID: {photo['id']}, Description: {photo.get('description') or photo.get('alt_description')}")
                print(f"     URL: {photo['urls']['regular']}")
            return [p['urls']['regular'] for p in results]
    except Exception as e:
        print(f"Error for query '{query}': {e}")
        return []

if __name__ == "__main__":
    test_napi("football turf")
