export interface Teacher {
  id: string;
  fullName: string;
  branch: string;
  email: string;
  phone?: string;
  status: 'matched' | 'unmatched' | 'sent' | 'failed' | 'idle';
  matchedPageNumber?: number;
  lastSentAt?: string;
  weeklyHours?: number;
}

export interface TimetableSlot {
  day: 'Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma';
  period: number; // 1 to 8
  className: string;
  subject: string;
  classroom?: string;
}

export interface SchedulePage {
  pageNumber: number;
  rawText: string;
  detectedName: string | null;
  cleanedName: string | null;
  confidence: number; // 0 - 100
  matchedTeacherId: string | null;
  status: 'matched' | 'manual_required' | 'unmatched' | 'sent';
  scheduleTitle?: string;
  classCount?: number;
  sampleSlots?: TimetableSlot[];
  pdfPageData?: string; // base64 or generated blob url
  exactHours?: string;
  exactClass?: string;
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  appPassword: string;
  senderName: string;
  replyTo: string;
  delayPerMailSeconds: number;
  isConfigured: boolean;
  simulationMode: boolean;
}

export interface MailLog {
  id: string;
  timestamp: string;
  teacherId: string;
  teacherName: string;
  email: string;
  pageNumber?: number;
  status: 'success' | 'failed' | 'pending' | 'sending';
  messageSubject: string;
  errorMessage?: string;
  deliveryDurationMs?: number;
}

export interface MailTemplate {
  subject: string;
  greetingPrefix: string;
  bodyText: string;
  footerText: string;
  includeSchoolEmblem: boolean;
  includePdfAttachment: boolean;
  includeInlineScheduleSummary: boolean;
}

export type ActiveTab = 'bento' | 'schedule' | 'teachers' | 'queue' | 'settings';
