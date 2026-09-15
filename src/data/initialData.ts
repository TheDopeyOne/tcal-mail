import { Teacher, SchedulePage, SmtpSettings, MailTemplate } from '../types';

export const INITIAL_TEACHERS: Teacher[] = [];

export const INITIAL_SCHEDULE_PAGES: SchedulePage[] = [];

export const INITIAL_SMTP_SETTINGS: SmtpSettings = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  user: '',
  appPassword: '',
  senderName: 'TOKİ Cumhuriyet Anadolu Lisesi Müdürlüğü',
  replyTo: '',
  delayPerMailSeconds: 1.5,
  isConfigured: false,
  simulationMode: true,
};

export const INITIAL_MAIL_TEMPLATE: MailTemplate = {
  subject: '{ogretmen_adi} - 2026-2027 Eğitim Öğretim Yılı Haftalık Ders Programınız',
  greetingPrefix: 'Sayın {ogretmen_adi},',
  bodyText: `2026-2027 Eğitim-Öğretim Yılı 1. Dönemine ait haftalık ders programınız hazırlanmıştır.

Sayfanıza ait kişiselleştirilmiş haftalık ders dağılım çizelgeniz ekte PDF formatında sunulmuştur. Lütfen ders saatlerinizi ve nöbet günlerinizi kontrol ederek okul idaresine bilgi veriniz.

Başarılı, sağlıklı ve verimli bir eğitim dönemi dileriz.`,
  footerText: `TOKİ Cumhuriyet Anadolu Lisesi Müdürlüğü
Okul İletişim: (0212) 555 01 02 | toki.meb.k12.tr
Bu e-posta otomatik bildirim sistemi üzerinden güvenle iletilmiştir.`,
  includeSchoolEmblem: true,
  includePdfAttachment: true,
  includeInlineScheduleSummary: true,
};
