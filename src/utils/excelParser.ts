import * as XLSX from 'xlsx';
import { Teacher } from '../types';

export interface ParsedTeacherRow {
  fullName: string;
  email: string;
  branch?: string;
  phone?: string;
}

/**
 * Parses uploaded Excel / CSV buffer or ArrayBuffer
 */
export async function parseTeacherSpreadsheet(file: File): Promise<ParsedTeacherRow[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to array of arrays
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (!rows || rows.length < 2) {
    throw new Error('Dosyada yeterli veri veya satır bulunamadı.');
  }

  // Find header row indices
  let headerRowIndex = 0;
  let nameCol = -1;
  let emailCol = -1;
  let branchCol = -1;
  let phoneCol = -1;

  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;

    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || '').toLowerCase().trim();
      if (cell.includes('ad') || cell.includes('isim') || cell.includes('öğretmen')) {
        nameCol = c;
      }
      if (cell.includes('mail') || cell.includes('eposta') || cell.includes('e-posta')) {
        emailCol = c;
      }
      if (cell.includes('branş') || cell.includes('brans') || cell.includes('ders')) {
        branchCol = c;
      }
      if (cell.includes('tel') || cell.includes('telefon') || cell.includes('gsm')) {
        phoneCol = c;
      }
    }

    if (nameCol !== -1 && emailCol !== -1) {
      headerRowIndex = r;
      break;
    }
  }

  // Fallback defaults if headers not strictly labeled
  if (nameCol === -1) nameCol = 0;
  if (emailCol === -1) emailCol = 1;
  if (branchCol === -1) branchCol = 2;

  const results: ParsedTeacherRow[] = [];

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;

    const rawName = String(row[nameCol] || '').trim();
    const rawEmail = String(row[emailCol] || '').trim();
    const rawBranch = branchCol !== -1 ? String(row[branchCol] || '').trim() : '';
    const rawPhone = phoneCol !== -1 ? String(row[phoneCol] || '').trim() : '';

    if (rawName && rawEmail && rawEmail.includes('@')) {
      results.push({
        fullName: rawName,
        email: rawEmail,
        branch: rawBranch || 'Genel',
        phone: rawPhone,
      });
    }
  }

  return results;
}

/**
 * Exports current teacher list or send logs to an Excel file
 */
export function exportToExcel(data: any[], fileName: string, sheetName = 'Sayfa1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
