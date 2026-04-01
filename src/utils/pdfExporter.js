import { formatTreeStructureForPdf } from "./treeFormatter";

function sanitizePdfText(text) {
  return text
    .replace(/\r/g, "")
    .replace(/[^\x20-\x7e\n]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapLine(line, maxLength = 92) {
  if (line.length <= maxLength) {
    return [line];
  }

  const wrapped = [];
  let remaining = line;

  while (remaining.length > maxLength) {
    let breakIndex = remaining.lastIndexOf(" ", maxLength);
    if (breakIndex <= 0) {
      breakIndex = maxLength;
    }
    wrapped.push(remaining.slice(0, breakIndex));
    remaining = remaining.slice(breakIndex).trimStart();
  }

  if (remaining) {
    wrapped.push(remaining);
  }

  return wrapped;
}

function formatMarkdownLineForPdf(line) {
  if (!line.trim()) {
    return "";
  }

  if (/^```/.test(line.trim())) {
    return "";
  }

  if (/^---+$/.test(line.trim())) {
    return "";
  }

  let formatted = line
    .replace(/^#{1,6}\s*/, "")
    .replace(/^(\s*)[-*]\s+/, "$1- ")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");

  if (/^\|.*\|$/.test(formatted.trim())) {
    formatted = formatted
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" | ");
  }

  return formatted;
}

function buildPdfTextLines({ title, report, structure }) {
  const plainReport = report
    .split("\n")
    .map(formatMarkdownLineForPdf)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const structureText = structure
    ? `Folder Structure\n${formatTreeStructureForPdf(structure)}`
    : "";

  return `${title}\nGenerated: ${new Date().toLocaleString()}\n\n${plainReport}${structureText ? `\n\n${structureText}` : ""}`
    .split("\n")
    .flatMap((line) => wrapLine(sanitizePdfText(line)));
}

export function downloadReviewPdf({ title, report, structure }) {
  const lines = buildPdfTextLines({ title, report, structure });
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 48;
  const lineHeight = 14;
  const linesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
  const pages = [];

  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }

  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const fontObjectId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const contentObjectIds = pages.map((pageLines) => {
    const streamLines = ["BT", "/F1 10 Tf", `${margin} ${pageHeight - margin} Td`, `${lineHeight} TL`];

    pageLines.forEach((line, index) => {
      if (index === 0) {
        streamLines.push(`(${line || " "}) Tj`);
      } else {
        streamLines.push("T*");
        streamLines.push(`(${line || " "}) Tj`);
      }
    });

    streamLines.push("ET");
    const stream = streamLines.join("\n");
    return addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  const pageObjectIds = contentObjectIds.map((contentId) =>
    addObject(
      `<< /Type /Page /Parent PAGES_PLACEHOLDER /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> >>`
    )
  );

  const kids = pageObjectIds.map((id) => `${id} 0 R`).join(" ");
  const pagesObjectId = addObject(`<< /Type /Pages /Kids [${kids}] /Count ${pageObjectIds.length} >>`);
  const catalogObjectId = addObject(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`);

  pageObjectIds.forEach((pageObjectId) => {
    objects[pageObjectId - 1] = objects[pageObjectId - 1].replace("PAGES_PLACEHOLDER", `${pagesObjectId} 0 R`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "review-report"}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
