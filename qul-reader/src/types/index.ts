/** A single ayah within a qul passage. */
export interface PassageAyah {
  ayah: number;
  text: string;
}

/** A qul passage spanning one or more ayahs. */
export interface QulPassage {
  surah: number;
  surah_name: string;
  start_ayah: number;
  end_ayah: number;
  span: number;
  method: string;
  ayahs: PassageAyah[];
}

/** Available font choices for the reader. */
export type FontChoice = "system" | "serif" | "noto-serif";

/** Settings state managed by the app. */
export interface ReaderSettings {
  translation: string;
  highlightEnabled: boolean;
  font: FontChoice;
}
