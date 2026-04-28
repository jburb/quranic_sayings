# extract_qul_ayahs_from_translation.py
#
# Extracts the full text of each "qul" (Say) passage from a given
# Quran translation, using the pre-computed span data in qul_spans.json
# (produced by find_qul_spans.py).
#
# Each qul passage may span one or more ayahs. The span boundaries are
# translation-specific — they were determined by quote-balance analysis
# on that particular translation's text.
#
# Usage:
#   python extract_qul_ayahs_from_translation.py <translation_json_file>
#   python extract_qul_ayahs_from_translation.py files/en.asad.json

import json
import sys
from datetime import datetime

SPANS_FILE = "qul_spans.json"

if len(sys.argv) < 2:
    print(f"Usage: python {sys.argv[0]} <translation_json_file>")
    print(f"Example: python {sys.argv[0]} files/en.asad.json")
    sys.exit(1)

translation_file = sys.argv[1]

# ── Load span data ────────────────────────────────────────────────
# qul_spans.json is keyed by edition identifier (e.g. "en.asad").
# Each edition maps to an array of { surah, start_ayah, end_ayah, method }.
with open(SPANS_FILE, "r", encoding="utf-8") as f:
    all_spans = json.load(f)

# ── Load the requested translation ────────────────────────────────
with open(translation_file, "r", encoding="utf-8") as f:
    translation_data = json.load(f)

edition = translation_data["data"]["edition"]["identifier"]

if edition not in all_spans:
    available = [k for k in all_spans if k != "_meta"]
    print(f"Error: no span data for '{edition}' in {SPANS_FILE}")
    print(f"Available translations: {', '.join(available)}")
    print(f"Run find_qul_spans.py with this translation first.")
    sys.exit(1)

spans = all_spans[edition]

# ── Build a lookup of all ayah texts in this translation ──────────
ayah_lookup = {}
surah_names = {}
for surah in translation_data["data"]["surahs"]:
    sn = surah["number"]
    surah_names[sn] = surah["englishName"]
    for ayah in surah["ayahs"]:
        ayah_lookup[(sn, ayah["numberInSurah"])] = ayah["text"]

# ── Extract each qul passage using its span ───────────────────────
results = []
for sp in spans:
    s = sp["surah"]
    start = sp["start_ayah"]
    end = sp["end_ayah"]

    # Collect text for every ayah in the span
    ayah_texts = []
    for a in range(start, end + 1):
        text = ayah_lookup.get((s, a), "")
        ayah_texts.append({"ayah": a, "text": text})

    results.append({
        "surah": s,
        "surah_name": surah_names.get(s, ""),
        "start_ayah": start,
        "end_ayah": end,
        "span": end - start + 1,
        "method": sp["method"],
        "ayahs": ayah_texts,
    })

# ── Print summary ─────────────────────────────────────────────────
multi = sum(1 for r in results if r["span"] > 1)
print(f"Translation: {edition}")
print(f"Total qul passages: {len(results)} ({multi} multi-ayah)\n")

for r in results:
    tag = f"[{r['surah']}:{r['start_ayah']}"
    if r["span"] > 1:
        tag += f"-{r['end_ayah']}"
    tag += f"] ({r['surah_name']})"

    # Show first ayah text, truncated
    first_text = r["ayahs"][0]["text"][:120]
    suffix = "..." if r["span"] > 1 or len(r["ayahs"][0]["text"]) > 120 else ""
    print(f"{tag} {first_text}{suffix}")

# ── Save full output ──────────────────────────────────────────────
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
output_file = f"qul_passages_{edition}_{timestamp}.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print(f"\nResults saved to {output_file}")
