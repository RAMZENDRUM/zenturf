import urllib.request

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
}

candidates = [
    "1574629810360-7efbbe195018", "1529900748604-07564a03e7a6", "1517466787929-bc90951d0974", "1431324155629-1a6eda1eed2d",
    "1551958219-acbc608c6377", "1560272564-c83d66b1ad12", "1518604666860-9ed391f76460", "1508098682722-e99c43a406b2",
    "1516733968668-dbdce39c46ef", "1489944440615-453fc2b6a9a9", "1511886929837-3ee44964f739",
    "1626224580175-340adc133a0c", "1613918431703-09434316d339", "1521537634581-0dced2fee2ef", "1554068865-24cecd4e34b8",
    "1623150247656-7881c62f267a", "1608245449230-4ac1906a4ac4", "1546519638-68e109498ffc", "1504450758481-7338eba7524a",
    "1503095396549-80705bc06ee0", "1492684223066-81342ee5ff30", "1514525253361-b83f859b73c0", "1517457373958-b7bdd458ad20",
    "1475721027785-f74eccf877e2", "1505373633572-2d039f37999a", "1496065187959-7f07b8353c55", "1519750157634-b6d493a0f77c"
]

print("Testing candidates...")
for pid in candidates:
    url = f"https://images.unsplash.com/photo-{pid}?auto=format&fit=crop&q=80&w=800"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=3) as res:
            print(f"ID: {pid} -> {res.status}")
    except Exception as e:
        print(f"ID: {pid} -> FAILED: {e}")
