import JSZip from "jszip";
import { Platform } from "react-native";
import { QulPassage } from "../types";
import { passagesToXhtmlChapters } from "./htmlRenderer";

// ── EPUB scaffold constants ──────────────────────────────────────────

const MIMETYPE = "application/epub+zip";

const CONTAINER_XML = `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

function buildContentOpf(
  title: string,
  chapters: { filename: string; title: string }[]
): string {
  const items = chapters
    .map(
      (c, i) =>
        `    <item id="ch${i}" href="${c.filename}" media-type="application/xhtml+xml"/>`
    )
    .join("\n");

  const spine = chapters
    .map((_, i) => `    <itemref idref="ch${i}"/>`)
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>Qul Reader</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="uid">urn:uuid:qul-reader-${Date.now()}</dc:identifier>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
${items}
  </manifest>
  <spine>
${spine}
  </spine>
</package>`;
}

function buildNav(
  chapters: { filename: string; title: string }[]
): string {
  const lis = chapters
    .map((c) => `      <li><a href="${c.filename}">${escapeXml(c.title)}</a></li>`)
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><meta charset="utf-8"/><title>Table of Contents</title></head>
<body>
  <nav epub:type="toc">
    <h1>Table of Contents</h1>
    <ol>
${lis}
    </ol>
  </nav>
</body>
</html>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Generate an EPUB file of the given passages and open the share sheet.
 */
export async function exportEpub(
  passages: QulPassage[],
  translationLabel: string,
  highlight: boolean
): Promise<void> {
  const bookTitle = `Qul Reader — ${translationLabel}`;
  const chapters = passagesToXhtmlChapters(passages, translationLabel, highlight);

  const zip = new JSZip();

  // mimetype must be the first entry, uncompressed
  zip.file("mimetype", MIMETYPE, { compression: "STORE" });

  // META-INF
  zip.file("META-INF/container.xml", CONTAINER_XML);

  // OEBPS
  zip.file("OEBPS/content.opf", buildContentOpf(bookTitle, chapters));
  zip.file("OEBPS/nav.xhtml", buildNav(chapters));

  for (const ch of chapters) {
    zip.file(`OEBPS/${ch.filename}`, ch.xhtml);
  }

  // Generate and deliver the EPUB
  if (Platform.OS === "web") {
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qul-reader.epub";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    const FileSystem = await import("expo-file-system");
    const Sharing = await import("expo-sharing");
    const base64 = await zip.generateAsync({ type: "base64" });
    const fileUri = `${FileSystem.cacheDirectory}qul-reader.epub`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/epub+zip",
      dialogTitle: bookTitle,
      UTI: "org.idpf.epub-container",
    });
  }
}
