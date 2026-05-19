import urllib.request

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
}

FOOTBALL_URLS = [
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1536122985607-4fe00b283652?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&q=80&w=800",
    "https://images.pexels.com/photos/33210166/pexels-photo-33210166.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/35911832/pexels-photo-35911832.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/32024428/pexels-photo-32024428.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/5652612/pexels-photo-5652612.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/34912371/pexels-photo-34912371.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/36624679/pexels-photo-36624679.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/30651230/pexels-photo-30651230.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/34049622/pexels-photo-34049622.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/34649361/pexels-photo-34649361.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/20430247/pexels-photo-20430247.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/35347471/pexels-photo-35347471.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/12768058/pexels-photo-12768058.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/13141521/pexels-photo-13141521.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/36409327/pexels-photo-36409327.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/36573287/pexels-photo-36573287.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/31091356/pexels-photo-31091356.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/29267100/pexels-photo-29267100.jpeg?auto=compress&cs=tinysrgb&w=800"
]

COURT_URLS = [
    "https://images.unsplash.com/photo-1544919982-b61976f0ba43?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=800",
    "https://images.pexels.com/photos/8007173/pexels-photo-8007173.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/36409327/pexels-photo-36409327.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/29046700/pexels-photo-29046700.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/34049622/pexels-photo-34049622.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/31096662/pexels-photo-31096662.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/6307230/pexels-photo-6307230.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/7648279/pexels-photo-7648279.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/6478667/pexels-photo-6478667.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/16131189/pexels-photo-16131189.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/10157895/pexels-photo-10157895.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/31091356/pexels-photo-31091356.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/32965264/pexels-photo-32965264.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/35911832/pexels-photo-35911832.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/7765742/pexels-photo-7765742.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/34116480/pexels-photo-34116480.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/12783350/pexels-photo-12783350.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/31054362/pexels-photo-31054362.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/30839836/pexels-photo-30839836.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/29267100/pexels-photo-29267100.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/35514787/pexels-photo-35514787.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/13025827/pexels-photo-13025827.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/10667388/pexels-photo-10667388.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/35214630/pexels-photo-35214630.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/17429850/pexels-photo-17429850.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/5741303/pexels-photo-5741303.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/18084429/pexels-photo-18084429.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/11213192/pexels-photo-11213192.jpeg?auto=compress&cs=tinysrgb&w=800"
]

AUDITORIUM_URLS = [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1496065187959-7f07b8353c55?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
    "https://images.pexels.com/photos/32529343/pexels-photo-32529343.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/4940642/pexels-photo-4940642.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/33470077/pexels-photo-33470077.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3023317/pexels-photo-3023317.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/2774568/pexels-photo-2774568.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/7942486/pexels-photo-7942486.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/36025679/pexels-photo-36025679.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/5945799/pexels-photo-5945799.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/7710087/pexels-photo-7710087.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/8500643/pexels-photo-8500643.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/4175028/pexels-photo-4175028.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/8197558/pexels-photo-8197558.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/33362590/pexels-photo-33362590.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/16859956/pexels-photo-16859956.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/2201538/pexels-photo-2201538.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/17081979/pexels-photo-17081979.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/14612128/pexels-photo-14612128.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/17081982/pexels-photo-17081982.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/10903291/pexels-photo-10903291.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/2914421/pexels-photo-2914421.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/32554998/pexels-photo-32554998.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3864594/pexels-photo-3864594.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/1709003/pexels-photo-1709003.jpeg?auto=compress&cs=tinysrgb&w=800"
]

def check_list(name, urls):
    print(f"\n--- Checking {name} ({len(urls)} urls) ---", flush=True)
    failed_count = 0
    for u in urls:
        req = urllib.request.Request(u, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=3) as res:
                if res.status != 200:
                    print(f"  [ERR] {u} -> status {res.status}", flush=True)
                    failed_count += 1
        except Exception as e:
            print(f"  [ERR] {u} -> {e}", flush=True)
            failed_count += 1
    print(f"Result for {name}: {failed_count} failed", flush=True)

check_list("FOOTBALL_URLS", FOOTBALL_URLS)
check_list("COURT_URLS", COURT_URLS)
check_list("AUDITORIUM_URLS", AUDITORIUM_URLS)
print("Validation complete!", flush=True)
