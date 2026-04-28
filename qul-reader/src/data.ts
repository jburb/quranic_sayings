import { QulPassage } from "../types";

import ahmedaliData from "../assets/data/en.ahmedali.json";
import ahmedrazaData from "../assets/data/en.ahmedraza.json";
import arberryData from "../assets/data/en.arberry.json";
import asadData from "../assets/data/en.asad.json";
import daryabadiData from "../assets/data/en.daryabadi.json";
import hilaliData from "../assets/data/en.hilali.json";
import itaniData from "../assets/data/en.itani.json";
import maududiData from "../assets/data/en.maududi.json";
import mubarakpuriData from "../assets/data/en.mubarakpuri.json";
import pickthallData from "../assets/data/en.pickthall.json";
import qaraiData from "../assets/data/en.qarai.json";
import qaribullahData from "../assets/data/en.qaribullah.json";
import sahihData from "../assets/data/en.sahih.json";
import sarwarData from "../assets/data/en.sarwar.json";
import shakirData from "../assets/data/en.shakir.json";
import wahiduddinData from "../assets/data/en.wahiduddin.json";
import yusufaliData from "../assets/data/en.yusufali.json";

/** Registry of bundled translations. Add new entries here as more are generated. */
const TRANSLATIONS: Record<string, { label: string; data: QulPassage[] }> = {
  "en.ahmedali":   { label: "Ahmed Ali",              data: ahmedaliData as QulPassage[] },
  "en.ahmedraza":  { label: "Ahmed Raza Khan",        data: ahmedrazaData as QulPassage[] },
  "en.arberry":    { label: "A. J. Arberry",           data: arberryData as QulPassage[] },
  "en.asad":       { label: "Muhammad Asad",           data: asadData as QulPassage[] },
  "en.daryabadi":  { label: "Abdul Majid Daryabadi",   data: daryabadiData as QulPassage[] },
  "en.hilali":     { label: "Hilali & Khan",           data: hilaliData as QulPassage[] },
  "en.itani":      { label: "Talal Itani",             data: itaniData as QulPassage[] },
  "en.maududi":    { label: "Abul Ala Maududi",        data: maududiData as QulPassage[] },
  "en.mubarakpuri":{ label: "Mubarakpuri",             data: mubarakpuriData as QulPassage[] },
  "en.pickthall":  { label: "Pickthall",               data: pickthallData as QulPassage[] },
  "en.qarai":      { label: "Qarai",                   data: qaraiData as QulPassage[] },
  "en.qaribullah": { label: "Qaribullah & Darwish",    data: qaribullahData as QulPassage[] },
  "en.sahih":      { label: "Saheeh International",    data: sahihData as QulPassage[] },
  "en.sarwar":     { label: "Muhammad Sarwar",         data: sarwarData as QulPassage[] },
  "en.shakir":     { label: "Shakir",                  data: shakirData as QulPassage[] },
  "en.wahiduddin": { label: "Wahiduddin Khan",         data: wahiduddinData as QulPassage[] },
  "en.yusufali":   { label: "Yusuf Ali",               data: yusufaliData as QulPassage[] },
};

export function getTranslationList(): { id: string; label: string }[] {
  return Object.entries(TRANSLATIONS).map(([id, { label }]) => ({ id, label }));
}

export function getPassages(translationId: string): QulPassage[] {
  return TRANSLATIONS[translationId]?.data ?? [];
}
