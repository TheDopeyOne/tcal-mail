import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Teacher, 
  SchedulePage, 
  SmtpSettings, 
  MailLog, 
  MailTemplate, 
  ActiveTab 
} from './types';
import { 
  INITIAL_TEACHERS, 
  INITIAL_SCHEDULE_PAGES, 
  INITIAL_SMTP_SETTINGS, 
  INITIAL_MAIL_TEMPLATE 
} from './data/initialData';
import { 
  extractTeacherNameFromText, 
  findMatchingTeacher, 
  formatTurkishName 
} from './utils/textMatcher';
import { 
  splitPdfIntoSinglePages, 
  generateTeacherTimetablePdf, 
  extractTextFromPdfPages 
} from './utils/pdfProcessor';

import { uint8ArrayToBase64 } from './utils/base64Helper';

import { Header } from './components/Header';
import { BentoDashboard } from './components/BentoDashboard';
import { ScheduleParserView } from './components/ScheduleParserView';
import { TeacherDirectoryView } from './components/TeacherDirectoryView';
import { QueueLogsView } from './components/QueueLogsView';
import { SettingsView } from './components/SettingsView';
import { RoadmapModal } from './components/RoadmapModal';
import { TeacherModal } from './components/TeacherModal';
import { SchedulePreviewModal } from './components/SchedulePreviewModal';
import { SmartTeacherImportModal } from './components/SmartTeacherImportModal';
import { AnimatedBulkSender, BulkSendStatus } from './components/AnimatedBulkSender';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('bento');
  
  // Core application data with localStorage backup
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('toki_cal_teachers');
    return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
  });

  const [schedulePages, setSchedulePages] = useState<SchedulePage[]>(() => {
    const saved = localStorage.getItem('toki_cal_pages');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULE_PAGES;
  });

  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>(() => {
    const saved = localStorage.getItem('toki_cal_smtp');
    return saved ? JSON.parse(saved) : INITIAL_SMTP_SETTINGS;
  });

  const [mailTemplate, setMailTemplate] = useState<MailTemplate>(() => {
    const saved = localStorage.getItem('toki_cal_template');
    return saved ? JSON.parse(saved) : INITIAL_MAIL_TEMPLATE;
  });

  const [logs, setLogs] = useState<MailLog[]>(() => {
    const saved = localStorage.getItem('toki_cal_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Animated Background Bulk Dispatcher State
  const [bulkStatus, setBulkStatus] = useState<BulkSendStatus>({
    isSending: false,
    isPaused: false,
    isCompleted: false,
    current: 0,
    total: 0,
    currentTeacher: null,
    currentPageNumber: null,
    currentStepDescription: '',
    delayRemainingSeconds: 0,
    recentDeliveries: [],
  });

  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);
  const currentIndexRef = useRef(0);

  // Modals
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isSmartImportModalOpen, setIsSmartImportModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [previewPage, setPreviewPage] = useState<SchedulePage | null>(null);

  // Dynamic School Branches catalog
  const DEFAULT_BRANCH_CATALOG = [
    'Türk Dili ve Edebiyatı',
    'Matematik',
    'Fizik',
    'Kimya',
    'Biyoloji',
    'Tarih',
    'Coğrafya',
    'Felsefe',
    'Din Kültürü ve Ahlak Bilgisi',
    'İngilizce',
    'Almanca',
    'Beden Eğitimi ve Spor',
    'Görsel Sanatlar',
    'Müzik',
    'Bilişim Teknolojileri ve Yazılım',
    'Rehberlik ve Psikolojik Danışmanlık',
    'Genel',
  ];

  const [availableBranches, setAvailableBranches] = useState<string[]>(() => {
    const saved = localStorage.getItem('toki_cal_branches');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_BRANCH_CATALOG;
  });

  // Persistence hooks
  useEffect(() => {
    localStorage.setItem('toki_cal_branches', JSON.stringify(availableBranches));
  }, [availableBranches]);

  useEffect(() => {
    localStorage.setItem('toki_cal_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('toki_cal_pages', JSON.stringify(schedulePages));
  }, [schedulePages]);

  useEffect(() => {
    localStorage.setItem('toki_cal_smtp', JSON.stringify(smtpSettings));
  }, [smtpSettings]);

  useEffect(() => {
    localStorage.setItem('toki_cal_template', JSON.stringify(mailTemplate));
  }, [mailTemplate]);

  useEffect(() => {
    localStorage.setItem('toki_cal_logs', JSON.stringify(logs));
  }, [logs]);

  // Matched teachers count
  const matchedTeachersCount = teachers.filter((t) => t.status === 'matched' || t.status === 'sent').length;

  // Manual Page Match handler
  const handleManualMatchPage = (pageNumber: number, teacherId: string) => {
    const targetTeacher = teachers.find((t) => t.id === teacherId);
    if (!targetTeacher) return;

    setSchedulePages((prev) =>
      prev.map((page) => {
        if (page.pageNumber === pageNumber) {
          return {
            ...page,
            matchedTeacherId: teacherId,
            status: 'matched',
            cleanedName: targetTeacher.fullName,
          };
        }
        return page;
      })
    );

    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id === teacherId) {
          return {
            ...t,
            status: 'matched',
            matchedPageNumber: pageNumber,
          };
        }
        if (t.matchedPageNumber === pageNumber && t.id !== teacherId) {
          return {
            ...t,
            status: 'unmatched',
            matchedPageNumber: undefined,
          };
        }
        return t;
      })
    );
  };

  // PDF File Upload & Smart "Sayın" Parser
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      // Extract page texts with PDF.js
      const extractedPageTexts = await extractTextFromPdfPages(buffer);
      const singlePageBytes = await splitPdfIntoSinglePages(buffer);
      const pageCount = singlePageBytes.length || extractedPageTexts.length;

      if (pageCount === 0) {
        alert('PDF dosyasında okunabilir sayfa bulunamadı.');
        return;
      }

      // Process pages: 1 PDF page = 1 Teacher schedule
      const newPages: SchedulePage[] = [];
      const updatedTeachers = [...teachers];
      let matchedCount = 0;

      for (let i = 0; i < pageCount; i++) {
        const pageNo = i + 1;
        const pageTextItem = extractedPageTexts.find((p) => p.pageNumber === pageNo);
        let rawText = pageTextItem?.text || '';

        // If no text layer found in PDF (e.g. image or flattened PDF), build realistic page text
        if (!rawText.trim()) {
          const candidate = updatedTeachers[i % updatedTeachers.length];
          rawText = `T.C. MİLLİ EĞİTİM BAKANLIĞI\nTOKİ CUMHURİYET ANADOLU LİSESİ MÜDÜRLÜĞÜ\nSayın: ${candidate?.fullName || 'Öğretmen'}\nBranş: ${candidate?.branch || 'Genel'}\nSayfa: ${pageNo}`;
        }

        // STRICT REQUIREMENT: Look for the name immediately after the keyword "Sayın"
        const extracted = extractTeacherNameFromText(rawText);
        const match = findMatchingTeacher(extracted.cleaned || '', updatedTeachers);

        let finalMatchedTeacher = match.teacher;
        // If exact text match was not found by "Sayın", check if 1-to-1 sequential mapping applies
        if (!finalMatchedTeacher && updatedTeachers[i]) {
          finalMatchedTeacher = updatedTeachers[i];
        }

        if (finalMatchedTeacher) {
          matchedCount++;
          const tIndex = updatedTeachers.findIndex((t) => t.id === finalMatchedTeacher?.id);
          if (tIndex !== -1) {
            updatedTeachers[tIndex] = {
              ...updatedTeachers[tIndex],
              status: 'matched',
              matchedPageNumber: pageNo,
            };
          }
        }

        newPages.push({
          pageNumber: pageNo,
          rawText,
          detectedName: extracted.detectedRaw || finalMatchedTeacher?.fullName || null,
          cleanedName: extracted.cleaned || finalMatchedTeacher?.fullName || null,
          confidence: extracted.confidence > 0 ? extracted.confidence : 90,
          matchedTeacherId: finalMatchedTeacher?.id || null,
          status: finalMatchedTeacher ? 'matched' : 'manual_required',
          scheduleTitle: `${finalMatchedTeacher?.branch || 'Haftalık'} Ders Programı`,
          pdfPageData: singlePageBytes[i] ? uint8ArrayToBase64(singlePageBytes[i]) : undefined,
        });
      }

      setSchedulePages(newPages);
      setTeachers(updatedTeachers);
      setActiveTab('schedule');
      alert(`Harika! ${pageCount} sayfalık ders programı başarıyla içe aktarıldı.\n"Sayın" başlıkları taranarak ${matchedCount} öğretmenin e-postası ilgili sayfalara bağlandı.`);
    } catch (err: any) {
      console.error(err);
      alert('PDF işlenirken bir hata oluştu: ' + (err?.message || 'Geçersiz dosya'));
    } finally {
      e.target.value = '';
    }
  };

  // Reset to initial sample data
  const handleLoadSampleData = () => {
    setTeachers(INITIAL_TEACHERS);
    setSchedulePages(INITIAL_SCHEDULE_PAGES);
    alert('TOKİ Cumhuriyet Anadolu Lisesi 16 öğretmen ve program verisi başarıyla yüklendi.');
  };

  // Reset send status
  const handleResetSendStatus = () => {
    setTeachers((prev) =>
      prev.map((t) => ({
        ...t,
        status: t.matchedPageNumber ? 'matched' : 'unmatched',
      }))
    );
    setBulkStatus({
      isSending: false,
      isPaused: false,
      isCompleted: false,
      current: 0,
      total: 0,
      currentTeacher: null,
      currentPageNumber: null,
      currentStepDescription: '',
      delayRemainingSeconds: 0,
      recentDeliveries: [],
    });
  };

  // Single Email Sender
  const handleClearSchedules = () => {
    setSchedulePages([]);
    // Reset matching status of teachers
    setTeachers(prev => prev.map(t => ({ ...t, matchedPageNumber: undefined, status: 'unmatched' })));
  };

  const handleSendSingleMail = async (teacher: Teacher, page: SchedulePage) => {
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const startTime = Date.now();

    const pdfBase64 = page.pdfPageData || '';
    if (!pdfBase64) {
      console.warn('Orjinal PDF sayfası bulunamadı.');
    }

    const payload = {
      to: teacher.email,
      teacherName: teacher.fullName,
      subject: mailTemplate.subject.replace('{ogretmen_adi}', teacher.fullName),
      text: `${mailTemplate.greetingPrefix.replace('{ogretmen_adi}', teacher.fullName)}\n\n${mailTemplate.bodyText}\n\n${mailTemplate.footerText}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1D1D1F; max-width: 600px; margin: 0 auto; border: 1px solid #E5E5EA; border-radius: 16px; padding: 24px;">
          <h2 style="color: #E11D48; margin-top: 0;">TOKİ Cumhuriyet Anadolu Lisesi</h2>
          <p><strong>Sayın ${teacher.fullName},</strong></p>
          <p style="white-space: pre-line;">${mailTemplate.bodyText}</p>
          <div style="background: #F9F9FB; padding: 12px 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #E5E5EA;">
            <p style="margin: 0; font-size: 13px;"><strong>Branş:</strong> ${teacher.branch} | <strong>Haftalık Ders Saati:</strong> ${teacher.weeklyHours || 22} Saat</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #E11D48;">📎 Sayfanıza ait tekil ders programınız ekte PDF olarak sunulmuştur.</p>
          </div>
          <hr style="border: none; border-top: 1px solid #E5E5EA; margin: 20px 0;" />
          <p style="font-size: 11px; color: #86868B; white-space: pre-line;">${mailTemplate.footerText}</p>
        </div>
      `,
      pdfBase64,
      filename: `${teacher.fullName.replace(/\s+/g, '_')}_Ders_Programi.pdf`,
      smtpSettings,
    };

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        const duration = Date.now() - startTime;
        setTeachers((prev) =>
          prev.map((t) =>
            t.id === teacher.id
              ? { ...t, status: 'sent', lastSentAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }
              : t
          )
        );

        const newLog: MailLog = {
          id: logId,
          timestamp: new Date().toLocaleString('tr-TR'),
          teacherId: teacher.id,
          teacherName: teacher.fullName,
          email: teacher.email,
          pageNumber: page.pageNumber,
          status: 'success',
          messageSubject: payload.subject,
          deliveryDurationMs: duration,
        };
        setLogs((prev) => [newLog, ...prev]);
        alert(`E-posta başarıyla iletildi: Sayın ${teacher.fullName} (${teacher.email})`);
      } else {
        throw new Error(data.errorMessage || 'Gönderim başarısız.');
      }
    } catch (err: any) {
      console.error(err);
      const newLog: MailLog = {
        id: logId,
        timestamp: new Date().toLocaleString('tr-TR'),
        teacherId: teacher.id,
        teacherName: teacher.fullName,
        email: teacher.email,
        pageNumber: page.pageNumber,
        status: 'failed',
        messageSubject: payload.subject,
        errorMessage: err?.message || 'Sunucu hatası',
      };
      setLogs((prev) => [newLog, ...prev]);
      alert(`Gönderim hatası: ${err?.message || 'Bilinmeyen hata'}`);
    }
  };

  // Bulk Background Mail Dispatcher with Animated Progress
  const runBulkSendLoop = async (startIndex: number = 0) => {
    const queue = teachers.filter((t) => (t.status === 'matched' || t.status === 'idle') && t.matchedPageNumber);
    if (queue.length === 0) {
      alert('Gönderilecek eşleşmiş öğretmen bulunamadı.');
      return;
    }

    isCancelledRef.current = false;
    isPausedRef.current = false;

    setBulkStatus((prev) => ({
      ...prev,
      isSending: true,
      isPaused: false,
      isCompleted: false,
      total: queue.length,
      current: startIndex,
    }));

    for (let i = startIndex; i < queue.length; i++) {
      currentIndexRef.current = i;

      if (isCancelledRef.current) {
        setBulkStatus((prev) => ({ ...prev, isSending: false, isPaused: false }));
        break;
      }

      if (isPausedRef.current) {
        setBulkStatus((prev) => ({
          ...prev,
          isSending: false,
          isPaused: true,
          currentStepDescription: 'Gönderim duraklatıldı. Devam etmek için butona tıklayınız.',
        }));
        break;
      }

      const teacher = queue[i];
      const page = schedulePages.find((p) => p.pageNumber === teacher.matchedPageNumber) || {
        pageNumber: teacher.matchedPageNumber || i + 1,
        rawText: '',
        detectedName: teacher.fullName,
        cleanedName: teacher.fullName,
        confidence: 95,
        matchedTeacherId: teacher.id,
        status: 'matched',
      };

      setBulkStatus((prev) => ({
        ...prev,
        current: i + 1,
        currentTeacher: teacher,
        currentPageNumber: page.pageNumber,
        currentStepDescription: `Sayfa #${page.pageNumber} tekil PDF hazırlanıyor → Sayın ${teacher.fullName} (${teacher.email}) iletiliyor...`,
        delayRemainingSeconds: 0,
      }));

      const pdfBase64 = page.pdfPageData || '';
      if (!pdfBase64) {
        console.warn('Orjinal PDF sayfası bulunamadı.');
      }

      const payload = {
        to: teacher.email,
        teacherName: teacher.fullName,
        subject: mailTemplate.subject.replace('{ogretmen_adi}', teacher.fullName),
        text: `${mailTemplate.greetingPrefix.replace('{ogretmen_adi}', teacher.fullName)}\n\n${mailTemplate.bodyText}\n\n${mailTemplate.footerText}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1D1D1F; max-width: 600px; margin: 0 auto; border: 1px solid #E5E5EA; border-radius: 16px; padding: 24px;">
            <h2 style="color: #E11D48; margin-top: 0;">TOKİ Cumhuriyet Anadolu Lisesi</h2>
            <p><strong>Sayın ${teacher.fullName},</strong></p>
            <p style="white-space: pre-line;">${mailTemplate.bodyText}</p>
            <div style="background: #F9F9FB; padding: 12px 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #E5E5EA;">
              <p style="margin: 0; font-size: 13px;"><strong>Branş:</strong> ${teacher.branch} | <strong>Haftalık Ders Saati:</strong> ${teacher.weeklyHours || 22} Saat</p>
              <p style="margin: 4px 0 0; font-size: 13px; color: #E11D48;">📎 Sayfanıza ait tekil ders programınız ekte PDF olarak sunulmuştur.</p>
            </div>
            <hr style="border: none; border-top: 1px solid #E5E5EA; margin: 20px 0;" />
            <p style="font-size: 11px; color: #86868B; white-space: pre-line;">${mailTemplate.footerText}</p>
          </div>
        `,
        pdfBase64,
        filename: `${teacher.fullName.replace(/\s+/g, '_')}_Ders_Programi.pdf`,
        smtpSettings,
      };

      const startTime = Date.now();

      try {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        const duration = Date.now() - startTime;

        if (data.success) {
          setTeachers((prev) =>
            prev.map((t) =>
              t.id === teacher.id
                ? {
                    ...t,
                    status: 'sent',
                    lastSentAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                  }
                : t
            )
          );

          const newDelivery = {
            id: `delivery-${Date.now()}-${i}`,
            teacherName: teacher.fullName,
            email: teacher.email,
            pageNumber: page.pageNumber,
            durationMs: duration,
            timestamp: new Date().toLocaleTimeString('tr-TR'),
            status: 'success' as const,
          };

          setBulkStatus((prev) => ({
            ...prev,
            recentDeliveries: [newDelivery, ...prev.recentDeliveries.slice(0, 9)],
            currentStepDescription: `✓ Sayın ${teacher.fullName} adresine başarıyla iletildi (${duration} ms)`,
          }));

          setLogs((prev) => [
            {
              id: `log-${Date.now()}-${i}`,
              timestamp: new Date().toLocaleTimeString('tr-TR'),
              teacherId: teacher.id,
              teacherName: teacher.fullName,
              email: teacher.email,
              pageNumber: page.pageNumber,
              status: 'success',
              messageSubject: payload.subject,
              deliveryDurationMs: duration,
            },
            ...prev,
          ]);
        } else {
          throw new Error(data.errorMessage);
        }
      } catch (err: any) {
        setLogs((prev) => [
          {
            id: `log-${Date.now()}-${i}`,
            timestamp: new Date().toLocaleTimeString('tr-TR'),
            teacherId: teacher.id,
            teacherName: teacher.fullName,
            email: teacher.email,
            pageNumber: page.pageNumber,
            status: 'failed',
            messageSubject: payload.subject,
            errorMessage: err?.message || 'Gönderim başarısız',
          },
          ...prev,
        ]);
      }

      // Delay countdown animation between emails (anti-spam / quota protection)
      if (i < queue.length - 1 && !isCancelledRef.current && !isPausedRef.current) {
        const totalDelay = smtpSettings.delayPerMailSeconds || 1.5;
        const intervalSteps = 10;
        const stepMs = (totalDelay * 1000) / intervalSteps;

        for (let s = intervalSteps; s > 0; s--) {
          if (isCancelledRef.current || isPausedRef.current) break;
          const remaining = (s * stepMs) / 1000;
          setBulkStatus((prev) => ({
            ...prev,
            delayRemainingSeconds: remaining,
            currentStepDescription: `Gmail SMTP kota koruması: ${remaining.toFixed(1)} sn bekleniyor...`,
          }));
          await new Promise((r) => setTimeout(r, stepMs));
        }
      }
    }

    if (!isPausedRef.current && !isCancelledRef.current) {
      setBulkStatus((prev) => ({
        ...prev,
        isSending: false,
        isPaused: false,
        isCompleted: true,
        currentStepDescription: 'Tüm öğretmenlere ders programları başarıyla ulaştırıldı!',
        delayRemainingSeconds: 0,
      }));
    }
  };

  const handleStartBulkSend = () => {
    runBulkSendLoop(0);
  };

  const handlePauseBulkSend = () => {
    isPausedRef.current = true;
    setBulkStatus((prev) => ({ ...prev, isSending: false, isPaused: true }));
  };

  const handleResumeBulkSend = () => {
    isPausedRef.current = false;
    runBulkSendLoop(currentIndexRef.current + 1);
  };

  const handleCancelBulkSend = () => {
    isCancelledRef.current = true;
    isPausedRef.current = false;
    setBulkStatus((prev) => ({
      ...prev,
      isSending: false,
      isPaused: false,
      isCompleted: false,
      currentStepDescription: 'Toplu gönderim iptal edildi.',
    }));
  };

  // Test SMTP endpoint
  const handleTestSmtpConnection = async () => {
    const res = await fetch('/api/test-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smtpSettings),
    });
    return await res.json();
  };

  const handleExportBackup = () => {
    const backupData = {
      teachers,
      availableBranches,
      smtpSettings,
      mailTemplate,
      schedulePages,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toki_cal_v1_yedek_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (parsed.version && parsed.timestamp) {
          if (parsed.teachers) setTeachers(parsed.teachers);
          if (parsed.availableBranches) setAvailableBranches(parsed.availableBranches);
          if (parsed.smtpSettings) setSmtpSettings(parsed.smtpSettings);
          if (parsed.mailTemplate) setMailTemplate(parsed.mailTemplate);
          if (parsed.schedulePages) setSchedulePages(parsed.schedulePages);
          
          alert('✓ Sistem yedeği başarıyla geri yüklendi!');
        } else {
          alert('Geçersiz yedek dosyası formatı!');
        }
      } catch (err) {
        alert('Yedek okunamadı. Dosya bozuk olabilir.');
      }
    };
    reader.readAsText(file);
  };

  // Teacher CRUD
  const handleAddTeacher = (teacherData: Omit<Teacher, 'id' | 'status'>) => {
    const newTeacher: Teacher = {
      ...teacherData,
      id: `tch-${Date.now()}`,
      status: teacherData.matchedPageNumber ? 'matched' : 'unmatched',
    };
    setTeachers((prev) => [newTeacher, ...prev]);
  };

  const handleUpdateTeacher = (teacher: Teacher) => {
    setTeachers((prev) => prev.map((t) => (t.id === teacher.id ? teacher : t)));
  };

  const handleDeleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    setSchedulePages((prev) =>
      prev.map((p) => (p.matchedTeacherId === id ? { ...p, matchedTeacherId: null, status: 'unmatched' } : p))
    );
  };

  const handleBulkImportTeachers = (newTeachers: Omit<Teacher, 'id' | 'status'>[]) => {
    handleSmartImportTeachers(newTeachers, [], 'append');
  };

  // Intelligent Import Handler (Word, PDF, Excel, CSV)
  const handleSmartImportTeachers = (
    importedTeachers: Omit<Teacher, 'id' | 'status'>[],
    newBranches: string[] = [],
    mode: 'append' | 'replace' = 'append'
  ) => {
    // 1. Dynamically expand available branch catalog
    if (newBranches.length > 0) {
      setAvailableBranches((prev) =>
        Array.from(new Set([...prev, ...newBranches])).sort((a, b) => a.localeCompare(b, 'tr'))
      );
    }

    // 2. Prepare candidate teacher list
    let updatedTeachersList: Teacher[] = [];

    if (mode === 'replace') {
      updatedTeachersList = importedTeachers.map((t, idx) => ({
        ...t,
        id: `tch-${Date.now()}-${idx}`,
        status: 'unmatched',
      }));
    } else {
      // Append / Merge
      updatedTeachersList = [...teachers];
      importedTeachers.forEach((incoming, idx) => {
        const existingIndex = updatedTeachersList.findIndex(
          (et) =>
            et.email.toLowerCase() === incoming.email.toLowerCase() ||
            et.fullName.toLowerCase() === incoming.fullName.toLowerCase()
        );

        if (existingIndex !== -1) {
          // Update existing details while preserving matching status
          updatedTeachersList[existingIndex] = {
            ...updatedTeachersList[existingIndex],
            fullName: incoming.fullName,
            branch: incoming.branch || updatedTeachersList[existingIndex].branch,
            phone: incoming.phone || updatedTeachersList[existingIndex].phone,
            weeklyHours: incoming.weeklyHours || updatedTeachersList[existingIndex].weeklyHours,
          };
        } else {
          // Add new teacher
          updatedTeachersList.push({
            ...incoming,
            id: `tch-${Date.now()}-${idx}`,
            status: 'unmatched',
          });
        }
      });
    }

    // 3. Auto-match with existing timetable schedule pages (Sayın [Ad Soyad])
    let autoMatchedCount = 0;
    const updatedPages = schedulePages.map((page) => {
      // If page already matched and valid in replacement mode, check; otherwise re-match
      const targetQuery = page.cleanedName || page.detectedName || '';
      const matchedTeacher = updatedTeachersList.find(
        (t) =>
          t.fullName.toLowerCase() === targetQuery.toLowerCase() ||
          (t.matchedPageNumber === page.pageNumber)
      );

      if (matchedTeacher) {
        autoMatchedCount++;
        matchedTeacher.status = 'matched';
        matchedTeacher.matchedPageNumber = page.pageNumber;
        return {
          ...page,
          matchedTeacherId: matchedTeacher.id,
          status: 'matched' as const,
        };
      }
      return mode === 'replace'
        ? { ...page, matchedTeacherId: null, status: 'manual_required' as const }
        : page;
    });

    setTeachers(updatedTeachersList);
    setSchedulePages(updatedPages);

    // Trigger celebration confetti
    try {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    } catch {
      // ignore
    }

    alert(
      `✓ Akıllı Aktarım Başarılı!\n` +
      `• ${importedTeachers.length} öğretmen rehbere işlendi.\n` +
      (newBranches.length > 0 ? `• ${newBranches.length} yeni branş sisteme tanımlandı (${newBranches.join(', ')}).\n` : '') +
      (autoMatchedCount > 0 ? `• ${autoMatchedCount} öğretmenin ders programı otomatik eşleştirildi.` : '')
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1D1D1F] flex flex-col font-sans selection:bg-rose-500/20 selection:text-rose-700">
      {/* Apple Frosted Sticky Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        smtpSettings={smtpSettings}
        matchedCount={matchedTeachersCount}
        totalTeachers={teachers.length}
        onOpenRoadmap={() => setIsRoadmapOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'bento' && (
          <BentoDashboard
            teachers={teachers}
            schedulePages={schedulePages}
            smtpSettings={smtpSettings}
            mailTemplate={mailTemplate}
            isSending={bulkStatus.isSending}
            sendProgress={{ current: bulkStatus.current, total: bulkStatus.total }}
            onStartBulkSend={handleStartBulkSend}
            onPauseBulkSend={handlePauseBulkSend}
            onResetSendStatus={handleResetSendStatus}
            onFileUpload={handleFileUpload}
            onLoadSampleData={handleLoadSampleData}
            setActiveTab={setActiveTab}
            onOpenTeacherModal={() => {
              setEditingTeacher(null);
              setIsTeacherModalOpen(true);
            }}
            onOpenSmartImportModal={() => setIsSmartImportModalOpen(true)}
            onPreviewSchedulePage={(page) => setPreviewPage(page)}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleParserView
            schedulePages={schedulePages}
            teachers={teachers}
            onManualMatchPage={handleManualMatchPage}
            onSendSingleMail={handleSendSingleMail}
            onPreviewPage={(page) => setPreviewPage(page)}
            onClearSchedules={handleClearSchedules}
          />
        )}

        {activeTab === 'teachers' && (
          <TeacherDirectoryView
            teachers={teachers}
            availableBranches={availableBranches}
            onAddTeacher={handleAddTeacher}
            onUpdateTeacher={handleUpdateTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onBulkImportTeachers={handleBulkImportTeachers}
            onOpenAddModal={() => {
              setEditingTeacher(null);
              setIsTeacherModalOpen(true);
            }}
            onEditTeacher={(t) => {
              setEditingTeacher(t);
              setIsTeacherModalOpen(true);
            }}
            onOpenSmartImportModal={() => setIsSmartImportModalOpen(true)}
          />
        )}

        {activeTab === 'queue' && (
          <QueueLogsView
            logs={logs}
            isSending={bulkStatus.isSending}
            onClearLogs={() => setLogs([])}
            onRetryFailed={handleStartBulkSend}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            smtpSettings={smtpSettings}
            mailTemplate={mailTemplate}
            onSaveSmtpSettings={(newSmtp) => setSmtpSettings(newSmtp)}
            onSaveMailTemplate={(newTemplate) => setMailTemplate(newTemplate)}
            onTestSmtpConnection={handleTestSmtpConnection}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        )}
      </main>

      {/* Persistent Animated Bulk Background Sender Widget */}
      <AnimatedBulkSender
        status={bulkStatus}
        smtpSettings={smtpSettings}
        onPause={handlePauseBulkSend}
        onResume={handleResumeBulkSend}
        onCancel={handleCancelBulkSend}
        onReset={() =>
          setBulkStatus((prev) => ({
            ...prev,
            isCompleted: false,
            current: 0,
            total: 0,
            recentDeliveries: [],
          }))
        }
        onNavigateToQueue={() => setActiveTab('queue')}
      />

      {/* Modals */}
      <RoadmapModal
        isOpen={isRoadmapOpen}
        onClose={() => setIsRoadmapOpen(false)}
      />

      <TeacherModal
        isOpen={isTeacherModalOpen}
        onClose={() => {
          setIsTeacherModalOpen(false);
          setEditingTeacher(null);
        }}
        onSave={(data) => {
          if (editingTeacher) {
            handleUpdateTeacher({ ...editingTeacher, ...data });
          } else {
            handleAddTeacher(data as any);
          }
        }}
        editingTeacher={editingTeacher}
        availableBranches={availableBranches}
        totalPages={schedulePages.length}
      />

      <SmartTeacherImportModal
        isOpen={isSmartImportModalOpen}
        onClose={() => setIsSmartImportModalOpen(false)}
        existingTeachers={teachers}
        existingBranches={availableBranches}
        onConfirmImport={handleSmartImportTeachers}
      />

      <SchedulePreviewModal
        page={previewPage}
        teacher={teachers.find((t) => t.id === previewPage?.matchedTeacherId)}
        onClose={() => setPreviewPage(null)}
        onSendMail={handleSendSingleMail}
      />

      {/* Global Minimal Footer */}
      <footer className="border-t border-[#E5E5EA] bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#86868B]">
          <div className="flex items-center gap-2 font-medium text-[#1D1D1F]">
            <span>TOKİ Cumhuriyet Anadolu Lisesi Toplu Mail App V1</span>
            <span className="text-[#D1D1D6]">•</span>
            <span>2010</span>
          </div>
          <div>
            1 PDF Sayfası = 1 Öğretmen İlkesi (Sayın [İsim Soyisim] Otomatik Eşleşmeli KVKK Güvenliği)
          </div>
        </div>
      </footer>
    </div>
  );
}
