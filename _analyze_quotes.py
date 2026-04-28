import json

with open('files/en.arberry.json', 'r', encoding='utf-8') as f:
    arb = json.load(f)
with open('files/en.asad.json', 'r', encoding='utf-8') as f:
    asd = json.load(f)

def get_ayahs(data, s, start, end):
    for surah in data['data']['surahs']:
        if surah['number'] == s:
            return [(a['numberInSurah'], a['text']) for a in surah['ayahs'] if start <= a['numberInSurah'] <= end]

def quote_stats(text):
    return {
        "sq_open": text.count("\u2018"), "sq_close": text.count("\u2019"),
        "dq_open": text.count("\u201c"), "dq_close": text.count("\u201d"),
        "plain_sq": text.count("'"), "plain_dq": text.count('"'),
    }

cases = [
    ("6:162-163 (multi-ayah)", 6, 162, 164),
    ("3:26-27 (multi-ayah)", 3, 26, 28),
    ("6:151-153 (multi-ayah)", 6, 151, 154),
    ("2:80 (single-ayah)", 2, 80, 81),
    ("2:94 (single-ayah)", 2, 94, 95),
]

for label, s, start, end in cases:
    print(f"=== {label} ===")
    for name, data in [("ARB", arb), ("ASD", asd)]:
        ayahs = get_ayahs(data, s, start, end)
        for num, text in ayahs:
            qs = quote_stats(text)
            print(f"  {name} [{num}] {qs}")
            print(f"    {text[:160]}")
    print()
