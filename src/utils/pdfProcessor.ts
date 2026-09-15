import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { SchedulePage, Teacher } from '../types';
import { extractTeacherNameFromText, findMatchingTeacher } from './textMatcher';

// Initialize PDF.js worker if in browser
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
}

/**
 * Extracts raw text page-by-page from an uploaded multi-page PDF document
 */
export async function extractTextFromPdfPages(
  pdfBytes: ArrayBuffer
): Promise<{ pageNumber: number; text: string }[]> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBytes.slice(0)),
      useSystemFonts: true,
      disableFontFace: true,
    });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const pageTexts: { pageNumber: number; text: string }[] = [];

    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const textItems = textContent.items
          .map((item: any) => (item && 'str' in item ? item.str : ''))
          .join(' ');
        pageTexts.push({ pageNumber: i, text: textItems });
      } catch (pageErr) {
        console.warn(`Sayfa ${i} metin okuma hatası:`, pageErr);
        pageTexts.push({ pageNumber: i, text: '' });
      }
    }
    return pageTexts;
  } catch (err) {
    console.warn('PDF.js metin ayıklama uyarısı:', err);
    return [];
  }
}

/**
 * Splits an existing PDF document page by page and creates standalone single-page PDF data URLs
 */
export async function splitPdfIntoSinglePages(pdfBytes: ArrayBuffer): Promise<Uint8Array[]> {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const pageCount = srcDoc.getPageCount();
  const singlePages: Uint8Array[] = [];

  for (let i = 0; i < pageCount; i++) {
    const subDoc = await PDFDocument.create();
    const [copiedPage] = await subDoc.copyPages(srcDoc, [i]);
    subDoc.addPage(copiedPage);
    const subBytes = await subDoc.save();
    singlePages.push(subBytes);
  }

  return singlePages;
}

/**
 * Generates a realistic styled PDF timetable page for a teacher
 */
export async function generateTeacherTimetablePdf(
  teacherName: string,
  branch: string,
  pageNumber: number,
  weeklyHours: number = 24
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait in points (210 x 297 mm)
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Background header bar
  page.drawRectangle({
    x: 30,
    y: height - 110,
    width: width - 60,
    height: 80,
    color: rgb(0.08, 0.08, 0.1),
  });

  // Top Red Accent line
  page.drawRectangle({
    x: 30,
    y: height - 32,
    width: width - 60,
    height: 4,
    color: rgb(0.88, 0.15, 0.15),
  });

  // Header Title
  page.drawText('T.C. MILLI EGITIM BAKANLIGI', {
    x: 50,
    y: height - 52,
    size: 9,
    font: fontBold,
    color: rgb(0.85, 0.85, 0.85),
  });

  page.drawText('TOKI CUMHURIYET ANADOLU LISESI MUDURLUGU', {
    x: 50,
    y: height - 70,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('2026-2027 Egitim Ogretim Yili 1. Donem Haftalik Ogretmen Ders Programi', {
    x: 50,
    y: height - 88,
    size: 10,
    font: font,
    color: rgb(0.75, 0.75, 0.78),
  });

  page.drawText(`Sayfa: ${pageNumber}`, {
    x: width - 110,
    y: height - 70,
    size: 11,
    font: fontBold,
    color: rgb(0.9, 0.2, 0.2),
  });

  // Teacher Card details
  page.drawRectangle({
    x: 30,
    y: height - 180,
    width: width - 60,
    height: 55,
    color: rgb(0.96, 0.96, 0.97),
    borderColor: rgb(0.85, 0.85, 0.88),
    borderWidth: 1,
  });

  page.drawText('Sayin: ', {
    x: 45,
    y: height - 150,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText(teacherName.toUpperCase(), {
    x: 90,
    y: height - 150,
    size: 14,
    font: fontBold,
    color: rgb(0.85, 0.1, 0.1),
  });

  page.drawText(`Brans: ${branch}   |   Haftalik Ders Saati: ${weeklyHours} Saat   |   Gecerlilik Tarihi: 15 Eylul 2026`, {
    x: 45,
    y: height - 170,
    size: 9.5,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Weekly Timetable Table Header
  const startY = height - 210;
  const colWidth = (width - 60) / 6;
  const rowHeight = 45;
  const days = ['Saat / Ders', 'Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma'];

  // Draw table header row
  page.drawRectangle({
    x: 30,
    y: startY - 26,
    width: width - 60,
    height: 26,
    color: rgb(0.12, 0.12, 0.15),
  });

  days.forEach((day, idx) => {
    page.drawText(day, {
      x: 35 + idx * colWidth,
      y: startY - 18,
      size: 9.5,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
  });

  // 8 Periods
  const periods = [
    { no: '1. Ders\n08:30-09:10', sampleClass: '10-A', room: 'D-101' },
    { no: '2. Ders\n09:20-10:00', sampleClass: '10-A', room: 'D-101' },
    { no: '3. Ders\n10:10-10:50', sampleClass: '11-B', room: 'D-203' },
    { no: '4. Ders\n11:00-11:40', sampleClass: '11-B', room: 'D-203' },
    { no: '5. Ders\n12:30-13:10', sampleClass: '12-A', room: 'D-302' },
    { no: '6. Ders\n13:20-14:00', sampleClass: '12-A', room: 'D-302' },
    { no: '7. Ders\n14:10-14:50', sampleClass: '9-C', room: 'D-104' },
    { no: '8. Ders\n15:00-15:40', sampleClass: '9-C', room: 'D-104' },
  ];

  periods.forEach((p, rIdx) => {
    const rowY = startY - 26 - (rIdx + 1) * rowHeight;
    const isEven = rIdx % 2 === 0;

    page.drawRectangle({
      x: 30,
      y: rowY,
      width: width - 60,
      height: rowHeight,
      color: isEven ? rgb(1, 1, 1) : rgb(0.98, 0.98, 0.99),
      borderColor: rgb(0.88, 0.88, 0.9),
      borderWidth: 0.5,
    });

    // Period label
    page.drawText(`${rIdx + 1}. Ders`, {
      x: 35,
      y: rowY + 28,
      size: 9,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(p.no.split('\n')[1] || '', {
      x: 35,
      y: rowY + 14,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Mock day cells
    for (let cIdx = 1; cIdx < 6; cIdx++) {
      const cellX = 35 + cIdx * colWidth;
      // alternate assignments
      if ((rIdx + cIdx) % 3 !== 0) {
        page.drawText(p.sampleClass, {
          x: cellX + 4,
          y: rowY + 26,
          size: 9.5,
          font: fontBold,
          color: rgb(0.1, 0.4, 0.8),
        });
        page.drawText(branch.substring(0, 12), {
          x: cellX + 4,
          y: rowY + 14,
          size: 7.5,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });
        page.drawText(p.room, {
          x: cellX + 4,
          y: rowY + 4,
          size: 6.5,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
      } else {
        page.drawText('-', {
          x: cellX + 25,
          y: rowY + 18,
          size: 12,
          font: font,
          color: rgb(0.8, 0.8, 0.8),
        });
      }
    }
  });

  // Footer Note & Stamp area
  const footerY = 70;
  page.drawRectangle({
    x: 30,
    y: footerY,
    width: width - 60,
    height: 48,
    color: rgb(0.97, 0.97, 0.98),
    borderColor: rgb(0.88, 0.88, 0.9),
    borderWidth: 0.5,
  });

  page.drawText('NOT: Ders programlarinda zorunlu hallerde yapilacak degisiklikler okul idaresince yazili bildirilecektir.', {
    x: 40,
    y: footerY + 30,
    size: 7.5,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText('TOKİ CUMHURIYET ANADOLU LISESI IDARESI   |   OKUL GMAIL SMTP OTOMASYONU ARACILIGIYLA GONDERILMISTIR', {
    x: 40,
    y: footerY + 15,
    size: 7.5,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  return await pdfDoc.save();
}
