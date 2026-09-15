import { Teacher } from '../types';

/**
 * Normalizes Turkish strings for comparison (case-insensitive, diacritic-tolerant)
 */
export function normalizeTurkish(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Capitalizes Turkish names properly (e.g. "AHMET YILMAZ" -> "Ahmet Yılmaz", "şükrü gülbahar" -> "Şükrü Gülbahar")
 * Accurately handles Turkish dotted and dotless I (İ/i and I/ı)
 */
export function formatTurkishName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLocaleLowerCase('tr-TR');
      if (!lower) return '';
      return lower.charAt(0).toLocaleUpperCase('tr-TR') + lower.slice(1);
    })
    .join(' ');
}

/**
 * Standard Turkish title case formatter alias for clear readability
 */
export const toTurkishTitleCase = formatTurkishName;

/**
 * Format branch name properly in Turkish (e.g. "TÜRK DİLİ VE EDEBİYATI" -> "Türk Dili ve Edebiyatı")
 * Keeps conjunctions 've', 'ile' in lowercase when they appear between words.
 */
export function toTurkishBranchCase(branch: string): string {
  if (!branch) return 'Genel';
  const words = branch.trim().split(/\s+/).filter(Boolean);
  const conjunctions = new Set(['ve', 'ile', 'veya']);

  return words
    .map((word, idx) => {
      const lower = word.toLocaleLowerCase('tr-TR');
      if (idx > 0 && conjunctions.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toLocaleUpperCase('tr-TR') + lower.slice(1);
    })
    .join(' ');
}

/**
 * Cleans, sanitizes and standardizes Turkish phone numbers
 * e.g. "0 (532) 123 45 67" -> "0532 123 45 67" or "+90 532 123 45 67"
 */
export function cleanAndFormatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return phone.trim();

  // 10 digits: 5321234567 -> 0532 123 45 67
  if (digits.length === 10 && digits.startsWith('5')) {
    return `0${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  // 11 digits starting with 0: 05321234567 -> 0532 123 45 67
  if (digits.length === 11 && digits.startsWith('05')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
  }
  // 12 digits starting with 90: 905321234567 -> +90 532 123 45 67
  if (digits.length === 12 && digits.startsWith('905')) {
    return `+90 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  }

  return phone.trim();
}

/**
 * Standardizes email addresses (lowercasing, trimming, removing erroneous spaces)
 */
export function cleanEmail(email: string): string {
  if (!email) return '';
  return email
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\w.@+\-]/g, '');
}

/**
 * Combines separate First Name (Ad) and Last Name (Soyad) into a standardized Full Name
 */
export function combineNameAndSurname(firstName: string, lastName: string): string {
  const f = formatTurkishName(firstName || '');
  const l = formatTurkishName(lastName || '');
  return `${f} ${l}`.trim();
}

/**
 * Splits a full name into first name and surname
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { firstName: fullName.trim(), lastName: '' };
  }
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, parts.length - 1).join(' ');
  return {
    firstName: formatTurkishName(firstName),
    lastName: formatTurkishName(lastName),
  };
}

/**
 * Specifically extracts teacher name following the keyword "Sayın", "Sayin", "SAYIN"
 * Handles Bilsa, DaVinci, ASC Timetables, e-Okul, and standard school timetable headers.
 */
export function extractTeacherNameFromText(text: string): {
  detectedRaw: string | null;
  cleaned: string | null;
  confidence: number;
  matchedKeyword: string;
} {
  if (!text) return { detectedRaw: null, cleaned: null, confidence: 0, matchedKeyword: '' };

  // Keywords and patterns specifically targeting "Sayın [İsim Soyisim]"
  const sayinPatterns = [
    // 1. "Sayın : AHMET YILMAZ" or "Sayın: Ahmet YILMAZ" or "SAYIN: FATMA KAYA"
    /(?:Sayın|Sayin|SAYIN)\s*[:\-\./]?\s*([a-zA-ZçÇğĞıİöÖşŞüÜ]+(?:\s+[a-zA-ZçÇğĞıİöÖşŞüÜ]+){1,3})/i,
    
    // 2. "Sayın Öğretmenimiz AHMET YILMAZ"
    /(?:Sayın|Sayin|SAYIN)\s+(?:Öğretmenimiz|Hocam|Hocamız)\s*[:\-\./]?\s*([a-zA-ZçÇğĞıİöÖşŞüÜ]+(?:\s+[a-zA-ZçÇğĞıİöÖşŞüÜ]+){1,3})/i,
    
    // 3. Multiline: "Sayın:\nAHMET YILMAZ"
    /(?:Sayın|Sayin|SAYIN)\s*[:\-\./]?\s*[\r\n\t]+\s*([a-zA-ZçÇğĞıİöÖşŞüÜ]+(?:\s+[a-zA-ZçÇğĞıİöÖşŞüÜ]+){1,3})/i,

    // 4. Sn. AHMET YILMAZ
    /\bSn\.?\s*([a-zA-ZçÇğĞıİöÖşŞüÜ]+(?:\s+[a-zA-ZçÇğĞıİöÖşŞüÜ]+){1,3})/i,

    // 5. "Öğretmen: AHMET YILMAZ" or "Ders Öğretmeni: AHMET YILMAZ"
    /(?:Öğretmen|Öğretmenin\s+Adı|Ders\s+Öğretmeni)\s*[:\-\./]?\s*([a-zA-ZçÇğĞıİöÖşŞüÜ]+(?:\s+[a-zA-ZçÇğĞıİöÖşŞüÜ]+){1,3})/i,
  ];

  // Stop words that might accidentally be captured if following the name
  const stopWords = new Set([
    'ders', 'programi', 'programı', 'haftalik', 'haftalık', 'brans', 'branş',
    'saat', 'saati', 'sinif', 'sınıf', 'pazartesi', 'milli', 'egitim', 'eğitim',
    'bakanligi', 'bakanlığı', 'okul', 'muduru', 'müdürü', 'lisesi', 'cumhuriyet', 'toki'
  ]);

  for (const regex of sayinPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      let candidate = match[1].trim();

      // Clean candidate of trailing stop words
      const rawWords = candidate.split(/\s+/).filter(Boolean);
      const filteredWords: string[] = [];
      for (const w of rawWords) {
        if (stopWords.has(w.toLowerCase())) {
          break; // stop when a header word is encountered
        }
        filteredWords.push(w);
      }

      if (filteredWords.length >= 2 && filteredWords.length <= 4) {
        const cleanName = filteredWords.join(' ');
        return {
          detectedRaw: cleanName,
          cleaned: formatTurkishName(cleanName),
          confidence: 98,
          matchedKeyword: 'Sayın',
        };
      }
    }
  }

  // Fallback: look for 2-3 word uppercase blocks that resemble a Turkish person's name
  const uppercaseMatch = text.match(/\b([A-ZÇĞİÖŞÜ]{2,}\s+[A-ZÇĞİÖŞÜ]{2,}(?:\s+[A-ZÇĞİÖŞÜ]{2,})?)\b/);
  if (uppercaseMatch && uppercaseMatch[1]) {
    const candidate = uppercaseMatch[1].trim();
    const words = candidate.split(/\s+/).filter((w) => !stopWords.has(w.toLowerCase()));
    if (words.length >= 2 && words.length <= 4) {
      const cleanName = words.join(' ');
      return {
        detectedRaw: cleanName,
        cleaned: formatTurkishName(cleanName),
        confidence: 75,
        matchedKeyword: 'BÜYÜK HARF',
      };
    }
  }

  return { detectedRaw: null, cleaned: null, confidence: 0, matchedKeyword: '' };
}

/**
 * Finds best matching teacher from database based on extracted name
 * Compares with teachers and returns their email and confidence score
 */
export function findMatchingTeacher(
  extractedName: string,
  teachers: Teacher[]
): { teacher: Teacher | null; score: number; email: string | null } {
  if (!extractedName || teachers.length === 0) {
    return { teacher: null, score: 0, email: null };
  }

  const normExtracted = normalizeTurkish(extractedName);
  const extractedWords = normExtracted.split(' ').filter(Boolean);

  let bestMatch: Teacher | null = null;
  let bestScore = 0;

  for (const teacher of teachers) {
    const normTeacher = normalizeTurkish(teacher.fullName);
    const teacherWords = normTeacher.split(' ').filter(Boolean);

    // Exact match: 100%
    if (normExtracted === normTeacher) {
      return { teacher, score: 100, email: teacher.email };
    }

    // Word intersection score (e.g. "Ahmet Yılmaz" vs "Ahmet Yılmaz (Mat)")
    let matchingWords = 0;
    for (const ew of extractedWords) {
      if (teacherWords.includes(ew)) {
        matchingWords++;
      }
    }

    if (matchingWords >= 2) {
      const score = Math.round((matchingWords / Math.max(extractedWords.length, teacherWords.length)) * 95);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = teacher;
      }
    } else if (normExtracted.includes(normTeacher) || normTeacher.includes(normExtracted)) {
      const score = 88;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = teacher;
      }
    }
  }

  return {
    teacher: bestMatch,
    score: bestScore,
    email: bestMatch?.email || null,
  };
}
