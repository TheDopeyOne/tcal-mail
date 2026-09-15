import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  formatTurkishName, 
  toTurkishBranchCase, 
  cleanAndFormatPhone, 
  cleanEmail, 
  combineNameAndSurname 
} from './textMatcher';

// Ensure PDF.js worker is properly referenced
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export type ColumnType =
  | 'name_combined'
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'branch'
  | 'phone'
  | 'weekly_hours'
  | 'ignore';

export interface ColumnMapping {
  columnIndex: number;
  headerName: string;
  detectedType: ColumnType;
  confidence: number;
  sampleValues: string[];
}

export interface RawTableData {
  fileName: string;
  fileType: 'excel' | 'word' | 'pdf' | 'csv' | 'paste';
  sheetNames?: string[];
  selectedSheet?: string;
  rawRows: string[][];
  hasHeaderRow: boolean;
  columnMappings: ColumnMapping[];
}

export interface ProcessedTeacherCandidate {
  tempId: string;
  selected: boolean;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  branch: string;
  phone: string;
  weeklyHours: number;
  validationStatus: 'valid' | 'warning' | 'error';
  validationMessage?: string;
  isExistingTeacher?: boolean;
  isNewBranch?: boolean;
  originalRowIndex: number;
}

/**
 * Parses any supported document (Excel, CSV, Word DOCX, PDF, or Plain Text) into a 2D string grid
 */
export async function parseDocumentToTable(file: File): Promise<RawTableData> {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  if (['xlsx', 'xls', 'csv'].includes(extension)) {
    return parseExcelOrCsvFile(file);
  } else if (extension === 'docx') {
    return parseWordDocxFile(file);
  } else if (extension === 'pdf') {
    return parsePdfTableFile(file);
  } else {
    // Attempt plain text / CSV fallback
    return parseTextFile(file);
  }
}

/**
 * Parses Excel / CSV files
 */
async function parseExcelOrCsvFile(file: File): Promise<RawTableData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  const firstSheet = workbook.Sheets[sheetNames[0]];

  const rawRows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
  const stringRows: string[][] = rawRows
    .map((row) => (Array.isArray(row) ? row.map((cell) => String(cell || '').trim()) : []))
    .filter((row) => row.some((cell) => cell.length > 0));

  if (stringRows.length === 0) {
    throw new Error('Dosyada okunabilir veri bulunamadı.');
  }

  const hasHeaderRow = detectIfFirstRowIsHeader(stringRows);
  const columnMappings = autoDetectColumnMappings(stringRows, hasHeaderRow);

  return {
    fileName: file.name,
    fileType: file.name.endsWith('.csv') ? 'csv' : 'excel',
    sheetNames,
    selectedSheet: sheetNames[0],
    rawRows: stringRows,
    hasHeaderRow,
    columnMappings,
  };
}

/**
 * Parses Microsoft Word (.docx) documents (tables & text lines)
 */
async function parseWordDocxFile(file: File): Promise<RawTableData> {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
  const html = result.value;

  // Use browser DOMParser to extract table structure
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tables = doc.querySelectorAll('table');

  const stringRows: string[][] = [];

  if (tables.length > 0) {
    // Extract rows from all tables
    tables.forEach((table) => {
      const trs = table.querySelectorAll('tr');
      trs.forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll('th, td')).map((td) => td.textContent?.trim() || '');
        if (cells.some((c) => c.length > 0)) {
          stringRows.push(cells);
        }
      });
    });
  }

  // Fallback: If no HTML table was generated, parse paragraphs separated by tabs/colons
  if (stringRows.length === 0) {
    const rawTextResult = await mammoth.extractRawText({ arrayBuffer: buffer });
    const lines = rawTextResult.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes(';')) {
        parts = line.split(';');
      } else if (line.includes('|')) {
        parts = line.split('|');
      } else {
        parts = line.split(/\s{2,}/); // 2 or more spaces
      }
      parts = parts.map((p) => p.trim()).filter((p) => p.length > 0);
      if (parts.length >= 2) {
        stringRows.push(parts);
      }
    }
  }

  if (stringRows.length === 0) {
    throw new Error('Word (.docx) dosyasında tablo veya öğretmen satırları tespit edilemedi.');
  }

  const hasHeaderRow = detectIfFirstRowIsHeader(stringRows);
  const columnMappings = autoDetectColumnMappings(stringRows, hasHeaderRow);

  return {
    fileName: file.name,
    fileType: 'word',
    rawRows: stringRows,
    hasHeaderRow,
    columnMappings,
  };
}

/**
 * Parses PDF documents by reconstructing table rows and coordinate columns
 */
async function parsePdfTableFile(file: File): Promise<RawTableData> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice(0)) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const allLines: string[][] = [];

  for (let pageNo = 1; pageNo <= numPages; pageNo++) {
    const page = await pdfDoc.getPage(pageNo);
    const textContent = await page.getTextContent();
    const items = textContent.items as Array<{ str: string; transform: number[] }>;

    // Group items by vertical Y coordinate (tolerance ~6 units)
    const rowGroups: Map<number, Array<{ text: string; x: number }>> = new Map();

    for (const item of items) {
      const text = item.str.trim();
      if (!text) continue;

      const x = item.transform[4];
      const y = Math.round(item.transform[5] / 7) * 7; // group by Y grid

      if (!rowGroups.has(y)) {
        rowGroups.set(y, []);
      }
      rowGroups.get(y)!.push({ text, x });
    }

    // Sort rows from top to bottom (descending Y in PDF coordinates)
    const sortedY = Array.from(rowGroups.keys()).sort((a, b) => b - a);

    for (const y of sortedY) {
      const group = rowGroups.get(y)!;
      // Sort columns left to right (ascending X)
      group.sort((a, b) => a.x - b.x);

      const rowCells = group.map((g) => g.text);
      if (rowCells.length >= 2) {
        allLines.push(rowCells);
      }
    }
  }

  if (allLines.length === 0) {
    throw new Error('PDF dosyasında ayrıştırılabilir tablo satırları bulunamadı.');
  }

  const hasHeaderRow = detectIfFirstRowIsHeader(allLines);
  const columnMappings = autoDetectColumnMappings(allLines, hasHeaderRow);

  return {
    fileName: file.name,
    fileType: 'pdf',
    rawRows: allLines,
    hasHeaderRow,
    columnMappings,
  };
}

/**
 * Parses direct pasted text or raw text file
 */
export function parsePastedTextToTable(pastedText: string): RawTableData {
  const lines = pastedText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    throw new Error('Yapıştırılan metin boş.');
  }

  const rawRows: string[][] = [];
  for (const line of lines) {
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes(';')) {
      parts = line.split(';');
    } else if (line.includes('|')) {
      parts = line.split('|');
    } else if (line.includes(',')) {
      parts = line.split(',');
    } else {
      parts = line.split(/\s{2,}/);
    }
    parts = parts.map((p) => p.trim());
    if (parts.some((p) => p.length > 0)) {
      rawRows.push(parts);
    }
  }

  const hasHeaderRow = detectIfFirstRowIsHeader(rawRows);
  const columnMappings = autoDetectColumnMappings(rawRows, hasHeaderRow);

  return {
    fileName: 'Yapıştırılan Metin',
    fileType: 'paste',
    rawRows,
    hasHeaderRow,
    columnMappings,
  };
}

async function parseTextFile(file: File): Promise<RawTableData> {
  const text = await file.text();
  const parsed = parsePastedTextToTable(text);
  parsed.fileName = file.name;
  return parsed;
}

/**
 * Detects if the first row is a header row
 */
function detectIfFirstRowIsHeader(rows: string[][]): boolean {
  if (rows.length < 2) return false;
  const firstRow = rows[0].join(' ').toLowerCase();
  const headerKeywords = [
    'ad', 'soyad', 'isim', 'öğretmen', 'email', 'mail', 'eposta', 'branş', 'brans', 'alan', 'tel', 'telefon', 'saat'
  ];
  return headerKeywords.some((kw) => firstRow.includes(kw));
}

/**
 * Known high school and primary subject branches in Turkish
 */
const KNOWN_BRANCHES = [
  'türk dili ve edebiyatı', 'edebiyat', 'matematik', 'fizik', 'kimya', 'biyoloji',
  'tarih', 'coğrafya', 'felsefe', 'din kültürü', 'ingilizce', 'almanca', 'fransızca',
  'beden eğitimi', 'müzik', 'görsel sanatlar', 'bilişim', 'rehberlik', 'teknoloji tasarım',
  'sosyal bilgiler', 'fen bilimleri', 'sınıf öğretmenliği', 'okul öncesi', 'özel eğitim'
];

/**
 * Evaluates column contents and automatically assigns semantic types
 */
export function autoDetectColumnMappings(rows: string[][], hasHeaderRow: boolean): ColumnMapping[] {
  if (rows.length === 0) return [];

  // Determine max column count
  const maxCols = Math.max(...rows.map((r) => r.length));
  const headerRow = hasHeaderRow ? rows[0] : [];
  const dataRows = hasHeaderRow ? rows.slice(1) : rows;

  const mappings: ColumnMapping[] = [];

  for (let c = 0; c < maxCols; c++) {
    const headerTitle = String(headerRow[c] || `Sütun ${c + 1}`).trim();
    const normalizedHeader = headerTitle.toLowerCase();
    const sampleValues = dataRows
      .slice(0, 8)
      .map((r) => String(r[c] || '').trim())
      .filter(Boolean);

    let detectedType: ColumnType = 'ignore';
    let confidence = 40;

    // 1. Email check
    const emailSampleCount = sampleValues.filter((v) => v.includes('@') && v.includes('.')).length;
    if (
      normalizedHeader.includes('mail') ||
      normalizedHeader.includes('eposta') ||
      normalizedHeader.includes('e-posta') ||
      normalizedHeader.includes('posta') ||
      emailSampleCount >= Math.min(2, sampleValues.length)
    ) {
      detectedType = 'email';
      confidence = 95;
    }
    // 2. Phone check
    else if (
      normalizedHeader.includes('tel') ||
      normalizedHeader.includes('gsm') ||
      normalizedHeader.includes('cep') ||
      normalizedHeader.includes('phone') ||
      normalizedHeader.includes('iletişim')
    ) {
      detectedType = 'phone';
      confidence = 90;
    } else if (
      sampleValues.filter((v) => v.replace(/\D/g, '').length >= 10).length >= Math.min(2, sampleValues.length)
    ) {
      detectedType = 'phone';
      confidence = 85;
    }
    // 3. Separate First Name or Last Name checks
    else if (
      (normalizedHeader === 'ad' || normalizedHeader === 'adı' || normalizedHeader === 'isim' || normalizedHeader === 'first name') &&
      !normalizedHeader.includes('soyad') &&
      !normalizedHeader.includes('soyisim')
    ) {
      detectedType = 'first_name';
      confidence = 92;
    } else if (
      normalizedHeader === 'soyad' ||
      normalizedHeader === 'soyadı' ||
      normalizedHeader === 'soyisim' ||
      normalizedHeader === 'last name' ||
      normalizedHeader === 'surname'
    ) {
      detectedType = 'last_name';
      confidence = 95;
    }
    // 4. Combined Name & Surname check
    else if (
      normalizedHeader.includes('ad soyad') ||
      normalizedHeader.includes('adı soyadı') ||
      normalizedHeader.includes('isim soyisim') ||
      normalizedHeader.includes('öğretmen') ||
      normalizedHeader.includes('full name') ||
      normalizedHeader.includes('personel')
    ) {
      detectedType = 'name_combined';
      confidence = 95;
    }
    // 5. Branch check
    else if (
      normalizedHeader.includes('branş') ||
      normalizedHeader.includes('brans') ||
      normalizedHeader.includes('ders') ||
      normalizedHeader.includes('alan') ||
      normalizedHeader.includes('bölüm')
    ) {
      detectedType = 'branch';
      confidence = 90;
    } else if (
      sampleValues.some((v) => KNOWN_BRANCHES.some((kb) => v.toLowerCase().includes(kb)))
    ) {
      detectedType = 'branch';
      confidence = 85;
    }
    // 6. Weekly hours check
    else if (
      normalizedHeader.includes('saat') ||
      normalizedHeader.includes('ders saati') ||
      normalizedHeader.includes('haftalık saat')
    ) {
      detectedType = 'weekly_hours';
      confidence = 85;
    }

    mappings.push({
      columnIndex: c,
      headerName: headerTitle,
      detectedType,
      confidence,
      sampleValues: sampleValues.slice(0, 3),
    });
  }

  // Sanity check: Ensure at least a name column exists
  const hasName = mappings.some((m) => m.detectedType === 'name_combined' || m.detectedType === 'first_name');
  if (!hasName && mappings.length > 0) {
    // If column 0 is not email or phone, assign as name_combined
    if (mappings[0].detectedType !== 'email' && mappings[0].detectedType !== 'phone') {
      mappings[0].detectedType = 'name_combined';
    }
  }

  return mappings;
}

/**
 * Converts raw table rows + column mappings into editable teacher candidate items
 */
export function buildTeacherCandidatesFromMappings(
  rawRows: string[][],
  mappings: ColumnMapping[],
  hasHeaderRow: boolean,
  existingTeachers: { fullName: string; email: string; branch: string }[],
  existingBranches: string[],
  applyTurkishCasing: boolean = true
): ProcessedTeacherCandidate[] {
  const dataRows = hasHeaderRow ? rawRows.slice(1) : rawRows;

  // Find column indices for mapped fields
  const nameCombinedCol = mappings.find((m) => m.detectedType === 'name_combined')?.columnIndex ?? -1;
  const firstNameCol = mappings.find((m) => m.detectedType === 'first_name')?.columnIndex ?? -1;
  const lastNameCol = mappings.find((m) => m.detectedType === 'last_name')?.columnIndex ?? -1;
  const emailCol = mappings.find((m) => m.detectedType === 'email')?.columnIndex ?? -1;
  const branchCol = mappings.find((m) => m.detectedType === 'branch')?.columnIndex ?? -1;
  const phoneCol = mappings.find((m) => m.detectedType === 'phone')?.columnIndex ?? -1;
  const hoursCol = mappings.find((m) => m.detectedType === 'weekly_hours')?.columnIndex ?? -1;

  const candidates: ProcessedTeacherCandidate[] = [];

  dataRows.forEach((row, idx) => {
    // Determine full name
    let rawFullName = '';
    if (nameCombinedCol !== -1 && row[nameCombinedCol]) {
      rawFullName = String(row[nameCombinedCol] || '').trim();
    } else if (firstNameCol !== -1) {
      const f = String(row[firstNameCol] || '').trim();
      const l = lastNameCol !== -1 ? String(row[lastNameCol] || '').trim() : '';
      rawFullName = combineNameAndSurname(f, l);
    } else if (row[0]) {
      rawFullName = String(row[0] || '').trim();
    }

    // Skip empty dummy rows
    if (!rawFullName) return;

    // Apply Turkish title case if requested
    const formattedFullName = applyTurkishCasing ? formatTurkishName(rawFullName) : rawFullName;

    // Email
    let rawEmail = emailCol !== -1 ? String(row[emailCol] || '').trim() : '';
    rawEmail = cleanEmail(rawEmail);

    // Branch
    let rawBranch = branchCol !== -1 ? String(row[branchCol] || '').trim() : 'Genel';
    if (applyTurkishCasing && rawBranch) {
      rawBranch = toTurkishBranchCase(rawBranch);
    }
    if (!rawBranch) rawBranch = 'Genel';

    // Phone
    let rawPhone = phoneCol !== -1 ? String(row[phoneCol] || '').trim() : '';
    if (rawPhone) {
      rawPhone = cleanAndFormatPhone(rawPhone);
    }

    // Weekly hours
    let hours = 22;
    if (hoursCol !== -1 && row[hoursCol]) {
      const parsedHours = parseInt(row[hoursCol].replace(/\D/g, ''), 10);
      if (!isNaN(parsedHours) && parsedHours > 0 && parsedHours < 60) {
        hours = parsedHours;
      }
    }

    // Validation & Matching
    let validationStatus: 'valid' | 'warning' | 'error' = 'valid';
    let validationMessage = '';

    if (!rawEmail || !rawEmail.includes('@')) {
      validationStatus = 'warning';
      validationMessage = 'E-posta eksik veya hatalı formatta';
    }

    const isExistingTeacher = existingTeachers.some(
      (et) =>
        et.email.toLowerCase() === rawEmail.toLowerCase() ||
        et.fullName.toLowerCase() === formattedFullName.toLowerCase()
    );

    const isNewBranch = Boolean(
      rawBranch &&
      rawBranch !== 'Genel' &&
      !existingBranches.some((eb) => eb.toLowerCase() === rawBranch.toLowerCase())
    );

    candidates.push({
      tempId: `candidate-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      selected: true,
      fullName: formattedFullName,
      email: rawEmail,
      branch: rawBranch,
      phone: rawPhone,
      weeklyHours: hours,
      validationStatus,
      validationMessage,
      isExistingTeacher,
      isNewBranch,
      originalRowIndex: idx,
    });
  });

  return candidates;
}
