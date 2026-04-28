"""
find_qul_spans.py

Analyses one or more English Quran translation JSON files to determine
the ayah span (start_ayah → end_ayah) of each "qul" (Say) statement.

The input is a list of qul starting-ayahs (from find_qul_ayahs.py) and
one or more translation JSONs from api.alquran.cloud. For each translation,
a quote-balance heuristic finds where the quoted "Say" speech ends.

Output: a single JSON file ("qul_spans.json") keyed by translation
identifier. Each translation maps to an array of span records. This file
is designed to be consumed by extract_qul_ayahs_from_translation.py to
pull the full text of each qul passage for a chosen translation.

Entries where the translation has no recognisable "Say" keyword
(no_say / unresolved) are recorded with end_ayah = start_ayah so that
downstream consumers always have a usable, if conservative, span.
"""

import json
import re
from datetime import datetime

QUL_FILE = "qul_ayah_starts_20260427_224202.json"
TRANSLATIONS = [
    "files/en.asad.json",
    "files/en.sahih.json",
]

with open(QUL_FILE, "r", encoding="utf-8") as f:
    qul_list = json.load(f)

qul_entries = [(e["surah"], e["ayah"]) for e in qul_list]
qul_set = set(qul_entries)


def load_translation(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    lookup = {}
    surah_max = {}
    for surah in data["data"]["surahs"]:
        sn = surah["number"]
        for ayah in surah["ayahs"]:
            lookup[(sn, ayah["numberInSurah"])] = ayah["text"]
            surah_max[sn] = max(surah_max.get(sn, 0), ayah["numberInSurah"])
    edition = data["data"]["edition"]["identifier"]
    return lookup, surah_max, edition


def count_real_quotes(text, qchar):
    """Count quotation marks, filtering out apostrophes for single-quote char."""
    if qchar == "'":
        # Replace apostrophes (quote char between word characters) with placeholder
        text = re.sub(r"(?<=\w)'(?=\w)", "\x00", text)
        return text.count("'")
    return text.count('"')


def detect_quote_char(text_after_say):
    """Find the first quote character after 'Say'."""
    for ch in text_after_say:
        if ch in ("'", '"'):
            return ch
    return None


def find_end_ayah(lookup, surah_max, surah, start_ayah):
    """
    Find the ending ayah of the qul statement starting at start_ayah.
    Uses quote-balance tracking: after the opening quote following 'Say:',
    scan forward until cumulative quote count is even (balanced).
    """
    text = lookup.get((surah, start_ayah), "")

    # Find all "Say" occurrences (case-insensitive)
    matches = list(re.finditer(r"\bSay\b", text, re.IGNORECASE))
    if not matches:
        return start_ayah, "no_say"

    # Check from last Say to first — the last unclosed one is the one that spans
    for m in reversed(matches):
        after = text[m.end():]
        qchar = detect_quote_char(after)
        if qchar is None:
            continue

        # Count quotes from the opening quote position onward
        qi = after.index(qchar)
        from_quote = after[qi:]
        qcount = count_real_quotes(from_quote, qchar)

        if qcount % 2 == 0:
            # This Say's quote is balanced within the ayah — try previous Say
            continue

        # Unbalanced — scan forward through subsequent ayahs
        cumulative = qcount  # odd number
        max_a = surah_max.get(surah, start_ayah)

        for a in range(start_ayah + 1, min(start_ayah + 30, max_a + 1)):
            ntext = lookup.get((surah, a), "")
            nq = count_real_quotes(ntext, qchar)
            cumulative += nq

            if cumulative % 2 == 0:
                return a, "balanced"

            # If we hit the start of a new qul statement, stop
            if (surah, a) in qul_set:
                return a - 1, "next_qul"

        return start_ayah, "unresolved"

    # All Says in this ayah are self-contained
    return start_ayah, "single_ayah"


# ── Process all translations and build per-edition span records ────
# Output structure:
#   {
#     "<edition_id>": [
#       { "surah": N, "start_ayah": N, "end_ayah": N, "method": "..." },
#       ...
#     ],
#     ...
#     "_meta": { "generated": "...", "qul_source": "...", "translations": [...] }
#   }

OUTPUT_FILE = "qul_spans.json"

# Try to load existing output so we can incrementally add translations
try:
    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        output = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    output = {}

for path in TRANSLATIONS:
    lookup, surah_max, edition = load_translation(path)
    spans = []
    skipped_count = 0

    for s, a in qul_entries:
        end_a, method = find_end_ayah(lookup, surah_max, s, a)

        if method in ("no_say", "unresolved"):
            # No recognisable "Say" or couldn't resolve — record conservatively
            skipped_count += 1
            spans.append({
                "surah": s,
                "start_ayah": a,
                "end_ayah": a,
                "method": method,
            })
        else:
            spans.append({
                "surah": s,
                "start_ayah": a,
                "end_ayah": end_a,
                "method": method,
            })

    output[edition] = spans
    multi = sum(1 for sp in spans if sp["end_ayah"] > sp["start_ayah"])
    print(f"{edition}: {len(spans)} spans ({multi} multi-ayah, {skipped_count} no_say/unresolved)")

# ── Write metadata and save ───────────────────────────────────────
output["_meta"] = {
    "generated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "qul_source": QUL_FILE,
    "translations": list(k for k in output if k != "_meta"),
    "notes": (
        "Each translation key maps to an array of span records. "
        "method indicates how end_ayah was determined: "
        "'balanced' = quote parity resolved, "
        "'next_qul' = stopped at next qul statement, "
        "'single_ayah' = fully contained in starting ayah, "
        "'no_say' = translation does not use 'Say' here, "
        "'unresolved' = could not determine end."
    ),
}

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)
print(f"\nSpan data saved to {OUTPUT_FILE}")
