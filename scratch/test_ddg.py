import sys
import subprocess

try:
    from duckduckgo_search import DDGS
except ImportError:
    print("Installing duckduckgo_search...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "duckduckgo_search"])
    from duckduckgo_search import DDGS

def get_images(query, count=5):
    print(f"Searching for '{query}'...")
    try:
        with DDGS() as ddgs:
            results = ddgs.images(query, max_results=count)
            urls = [r['image'] for r in results if r.get('image')]
            print(f"Found {len(urls)} images")
            for u in urls[:3]:
                print("  ", u)
            return urls
    except Exception as e:
        print("Error during DDG search:", e)
        return []

if __name__ == "__main__":
    get_images("Tiki Taka Chennai turf", 3)
