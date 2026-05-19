import urllib.request

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
}

FOOTBALL_IDS = [
    "1508098682722-e99c43a406b2", "1574629810360-7efbbe195018", "1529900748604-07564a03e7a6", "1517466787929-bc90951d0974",
    "1431324155629-1a6eda1eed2d", "1551958219-acbc608c6377", "1560272564-c83d66b1ad12", "1518604666860-9ed391f76460",
    "1516733968668-dbdce39c46ef", "1489944440615-453fc2b6a9a9", "1511886929837-3ee44964f739", "1504156806644-7f15b8548a8e",
    "1459865264687-595d652de67e", "1536122985607-4fe00b283652", "1556056504-517cd025e8e4", "1518063319789-7217e6706b04",
    "1524015364736-613d907ba9ce", "1606925797300-0b35e9d17400", "1595164503714-d022b7810b1a", "1575361204480-aadea25e6e68"
]
COURT_IDS = [
    "1544919982-b61976f0ba43", "1626224580175-340adc133a0c", "1613918431703-09434316d339", "1623150247656-7881c62f267a",
    "1608245449230-4ac1906a4ac4", "1521537634581-0dced2fee2ef", "1554068865-24cecd4e34b8", "1519766304817-4f37bda74a27",
    "1546519638-68e109498ffc", "1504450758481-7338eba7524a", "1515233187658-d5ba04a55e73", "1505666287802-9d48d6943f7a",
    "1512719051415-8d513e79d346", "1509177114292-62423cb118a1", "1579952365111-41c1141ee772", "1528605248644-14dd04022da1",
    "1500600788642-d6a23e7f3cb7", "1538382426908-0cf8f107f9c2", "1595435934249-5df7ed86e1c0", "1622279457436-e2a281896792"
]
AUDITORIUM_IDS = [
    "1503095396549-80705bc06ee0", "1492684223066-81342ee5ff30", "1514525253361-b83f859b73c0", "1517457373958-b7bdd458ad20",
    "1475721027785-f74eccf877e2", "1505373633572-2d039f37999a", "1496065187959-7f07b8353c55", "1519750157634-b6d493a0f77c",
    "1506157786161-d84cd04ff63e", "1540575467-07436697aae5", "1516972810927-4cd707d0d5c6", "1511795409834-ef04bbd61622",
    "1464366400761-e7379d6c4e0b", "1519167758481-8e3c852a36b9", "1520330534440-de52793b6e19", "1511578314324-11a5113d80d2",
    "1507584975312-3069a7c36a83", "1527525428750-fb97f8e3f22d", "1517048676585-42211d2b775a", "1522158673750-da95904323c2"
]

def check_list(name, ids):
    print(f"\n--- Checking {name} ({len(ids)} ids) ---")
    working = []
    broken = []
    for pid in ids:
        url = f"https://images.unsplash.com/photo-{pid}?auto=format&fit=crop&q=80&w=800"
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=3) as res:
                if res.status == 200:
                    working.append(pid)
                    print(f"  [OK]  {pid}")
                else:
                    broken.append(pid)
                    print(f"  [ERR] {pid} -> status {res.status}")
        except Exception as e:
            broken.append(pid)
            print(f"  [ERR] {pid} -> {e}")
    print(f"Summary for {name}: {len(working)} working, {len(broken)} broken")
    print(f"Working list: {working}")

check_list("FOOTBALL_IDS", FOOTBALL_IDS)
check_list("COURT_IDS", COURT_IDS)
check_list("AUDITORIUM_IDS", AUDITORIUM_IDS)
