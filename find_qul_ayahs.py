import json
from datetime import datetime

with open("files/quran-uthmani.json", "r", encoding="utf-8") as f:
    data = json.load(f)

targets = {"قُلْ", "قُل", "قُلِ", "فَقُلْ", "فَقُل", "فَقُلِ", "وَقُلْ", "وَقُل", "وَقُلِ"}
results = []

for surah in data["data"]["surahs"]:
    surah_number = surah["number"]
    for ayah in surah["ayahs"]:
        words = ayah["text"].split()
        if targets.intersection(words):
            results.append({
                "surah": surah_number,
                "ayah": ayah["numberInSurah"],
            })

print(f"Total ayahs containing imperative 'qul' forms: {len(results)}\n")
for r in results:
    print(f"Surah {r['surah']}, Ayah {r['ayah']}")

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
output_file = f"qul_ayahs_{timestamp}.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)
print(f"\nResults saved to {output_file}")
