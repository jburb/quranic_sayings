import { Platform } from "react-native";
import { QulPassage } from "../types";
import { passagesToHtmlDocument } from "./htmlRenderer";

/**
 * On web: open the HTML in a new window and trigger the browser's print
 * dialog (Firefox / Chrome both offer "Save as PDF" from there).
 */
function exportPdfWeb(html: string): void {
  const win = window.open("", "_blank");
  if (!win) {
    throw new Error("Pop-up blocked — please allow pop-ups for this site and try again.");
  }
  win.document.write(html);
  win.document.close();
  // Small delay so the content renders before the print dialog opens
  setTimeout(() => win.print(), 300);
}

/**
 * On native: use expo-print to generate a PDF file, then share it.
 */
async function exportPdfNative(html: string, translationLabel: string): Promise<void> {
  const Print = await import("expo-print");
  const Sharing = await import("expo-sharing");

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: `Qul Reader — ${translationLabel}`,
    UTI: "com.adobe.pdf",
  });
}

/**
 * Generate a PDF of the given passages.
 * - Native (iOS/Android): generates a file and opens the share sheet.
 * - Web: opens a print dialog where the user can "Save as PDF".
 */
export async function exportPdf(
  passages: QulPassage[],
  translationLabel: string,
  highlight: boolean
): Promise<void> {
  const html = passagesToHtmlDocument(passages, translationLabel, highlight);

  if (Platform.OS === "web") {
    exportPdfWeb(html);
  } else {
    await exportPdfNative(html, translationLabel);
  }
}
