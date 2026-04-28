all quran text downloaded via public rest apis documented at:
https://alquran.cloud/api 
on: 
2019-10-19
(en.sahih.json added 2026-04-27)

================================================================================
SCRIPTS - qul (Say) ayah analysis pipeline
================================================================================

1. find_qul_ayahs.py
   Searches the Arabic Quran (files/quran-uthmani.json) for all ayahs containing
   imperative forms of "qul" (قُلْ ,قُل ,قُلِ and prefixed variants فَقُلْ ,وَقُل etc).
   Outputs a timestamped JSON list of starting locations (surah + ayah number).

   Usage:  python find_qul_ayahs.py
   Output: qul_ayah_starts_<datetime>.json

2. find_qul_spans_consensus.py
   For each qul starting-ayah, determines the ending ayah of the "Say" passage
   in each English translation listed in its TRANSLATIONS array. Uses a
   quote-balance heuristic (tracking open/close quotation marks after "Say:").
   Results are stored in qul_spans.json, keyed by translation identifier.
   Running again with new translations merges them into the existing file.

   Usage:  python find_qul_spans_consensus.py
   Input:  qul_ayah_starts_<datetime>.json, translation JSON files
   Output: qul_spans.json

3. extract_qul_ayahs_from_translation.py
   Reads span data from qul_spans.json and extracts the full ayah text for
   each qul passage from a specified translation. Multi-ayah spans include
   all ayahs in the range. If the requested translation is not yet in
   qul_spans.json, run find_qul_spans_consensus.py with it first.

   Usage:  python extract_qul_ayahs_from_translation.py <translation_json>
   Example: python extract_qul_ayahs_from_translation.py files/en.sahih.json
   Input:  qul_spans.json, translation JSON file
   Output: qul_passages_<edition>_<datetime>.json
