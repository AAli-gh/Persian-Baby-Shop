/**
 * Renders a CSV cell: quotes the RFC 4180 special characters and neutralises
 * the leading characters that spreadsheet software would evaluate as a formula.
 */
function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** Renders a full CSV document (BOM included so Excel picks up UTF-8). */
export function toCsv(header: string[], rows: unknown[][]): string {
  const lines = [header.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))];
  return `﻿${lines.join("\r\n")}`;
}
