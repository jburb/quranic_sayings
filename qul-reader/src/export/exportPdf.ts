import { Platform } from "react-native";
import { QulPassage } from "../types";
import { passagesToHtmlDocument } from "./htmlRenderer";

/**
 * On web: render the HTML into a hidden container, convert to a real PDF
 * file via html2pdf.js, and trigger a browser download.
 */
async function exportPdfWeb(html: string, filename: string): Promise<void> {
  const html2pdf = (await import("html2pdf.js")).default;

  // Create an off-screen container so html2pdf can measure the DOM
  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.width = "720px";
  document.body.appendChild(container);

  try {
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(container)
      .save();
  } finally {
    document.body.removeChild(container);
  }
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
    await exportPdfWeb(html, `qul-reader-${translationLabel.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  } else {
    await exportPdfNative(html, translationLabel);
  }
}
