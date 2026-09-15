import React, { useState } from 'react';
import { 
  FileUp, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  FileText, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw,
  MailCheck,
  Eye,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import { Teacher, SchedulePage, SmtpSettings, MailTemplate, ActiveTab } from '../types';

interface BentoDashboardProps {
  teachers: Teacher[];
  schedulePages: SchedulePage[];
  smtpSettings: SmtpSettings;
  mailTemplate: MailTemplate;
  isSending: boolean;
  sendProgress: { current: number; total: number };
  onStartBulkSend: () => void;
  onPauseBulkSend: () => void;
  onResetSendStatus: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadSampleData: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenTeacherModal: () => void;
  onOpenSmartImportModal?: () => void;
  onPreviewSchedulePage: (page: SchedulePage) => void;
}

export const BentoDashboard: React.FC<BentoDashboardProps> = ({
  teachers,
  schedulePages,
  smtpSettings,
  mailTemplate,
  isSending,
  sendProgress,
  onStartBulkSend,
  onPauseBulkSend,
  onResetSendStatus,
  onFileUpload,
  onLoadSampleData,
  setActiveTab,
  onOpenTeacherModal,
  onOpenSmartImportModal,
  onPreviewSchedulePage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // Statistics
  const totalTeachers = teachers.length;
  const matchedTeachers = teachers.filter((t) => t.status === 'matched' || t.status === 'sent').length;
  const sentCount = teachers.filter((t) => t.status === 'sent').length;
  const unmatchedTeachers = teachers.filter((t) => t.status === 'unmatched');
  const matchedPages = schedulePages.filter((p) => p.status === 'matched').length;
  const reviewRequiredPages = schedulePages.filter((p) => p.status === 'manual_required' || !p.matchedTeacherId);

  const completionPercentage = totalTeachers > 0 ? Math.round((sentCount / totalTeachers) * 100) : 0;
  const matchPercentage = totalTeachers > 0 ? Math.round((matchedTeachers / totalTeachers) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Welcome Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-linear-to-r from-[#1C1C1E] via-[#242426] to-[#1C1C1E] text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-600/90 text-white tracking-wide">
              TOKİ CAL V1
            </span>
            <span className="text-xs text-zinc-400">2026-2027 Eğitim Öğretim Yılı</span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-zinc-300">
              1 Sayfa = 1 Öğretmen
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Öğretmen Ders Programı Otomatik Dağıtım Masası
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
            Ders programı PDF'i öğretmen sayısı kadar sayfadan oluşur. Her sayfadaki <strong>"Sayın [İsim Soyisim]"</strong> taranarak öğretmen mailleriyle 1:1 eşleştirilir ve animasyonlu arka plan kuyruğuyla Gmail üzerinden toplu postalanır.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onLoadSampleData}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all border border-white/10"
            title="Örnek 16 Öğretmen & Programı Yükle"
          >
            Örnek Veri Yükle
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white active:scale-95 transition-all shadow-md flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            Programları İncele
          </button>
        </div>
      </div>

      {/* Bento Grid: Row 1 - High Impact Metrics (Apple Bento Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Teachers */}
        <div 
          onClick={() => setActiveTab('teachers')}
          className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-xs hover:shadow-md hover:border-[#D1D1D6] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#86868B]">Öğretmen Rehberi</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#1D1D1F] tracking-tight">
              {totalTeachers}
            </span>
            <span className="text-xs font-medium text-[#86868B]">Kayıtlı</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-blue-600 font-semibold">
            <span>Rehberi Aç</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Metric 2: Extracted PDF Pages */}
        <div 
          onClick={() => setActiveTab('schedule')}
          className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-xs hover:shadow-md hover:border-[#D1D1D6] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#86868B]">PDF Sayfaları</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#1D1D1F] tracking-tight">
              {schedulePages.length}
            </span>
            <span className="text-xs font-medium text-purple-600">Ayrıştırıldı</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-purple-600 font-semibold">
            <span>Sayfaları Listele</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Metric 3: Match Success */}
        <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#86868B]">Eşleşme Oranı</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#1D1D1F] tracking-tight">
              %{matchPercentage}
            </span>
            <span className="text-xs font-medium text-[#86868B]">
              ({matchedTeachers}/{totalTeachers})
            </span>
          </div>
          <div className="mt-3 w-full bg-[#E5E5EA] h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${matchPercentage}%` }} 
            />
          </div>
        </div>

        {/* Metric 4: Sent Progress */}
        <div 
          onClick={() => setActiveTab('queue')}
          className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-xs hover:shadow-md hover:border-[#D1D1D6] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#86868B]">İletilen Mailler</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MailCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#1D1D1F] tracking-tight">
              {sentCount}
            </span>
            <span className="text-xs font-medium text-[#86868B]">/{totalTeachers}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-rose-600 font-semibold">
            <span>Canlı Kuyruk</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Bento Grid: Row 2 - Main Interactive Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Big Bento Tile (7 cols): One-Click Bulk Sender & Progress Deck */}
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                  Gönderim Kontrol Masası
                </span>
              </div>
              <span className="text-xs text-[#86868B]">
                {smtpSettings.simulationMode ? 'Simülasyon Modu Açık' : 'Gmail SMTP Canlı'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-[#1D1D1F] tracking-tight">
              Ders Programlarını Öğretmenlere Toplu İlet
            </h3>
            <p className="text-xs sm:text-sm text-[#86868B] leading-relaxed">
              Her öğretmen için ayrıştırılmış program sayfası eklenerek <strong>{smtpSettings.delayPerMailSeconds} sn</strong> aralıklarla Gmail üzerinden arka planda postalanır.
            </p>
          </div>

          {/* Live Progress Bar if sending or partially completed */}
          <div className="p-4 rounded-2xl bg-[#F9F9FB] border border-[#E5E5EA] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1D1D1F]">
                {isSending ? 'Arka Plan Gönderimi Yapılıyor...' : sentCount > 0 ? 'Gönderim Tamamlandı / Duraklatıldı' : 'Gönderim İçin Hazır'}
              </span>
              <span className="font-mono font-bold text-rose-600">
                {sendProgress.current} / {sendProgress.total || totalTeachers} (%{completionPercentage})
              </span>
            </div>
            <div className="w-full bg-[#E5E5EA] h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-linear-to-r from-rose-600 to-orange-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#86868B]">
              <span>Gönderici: <strong>{smtpSettings.senderName}</strong></span>
              <span>Kalan: <strong>{Math.max(0, (sendProgress.total || totalTeachers) - sentCount)} Öğretmen</strong></span>
            </div>
          </div>

          {/* Action Launchers */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!isSending ? (
              <button
                onClick={onStartBulkSend}
                disabled={matchedTeachers === 0}
                className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-bold text-white bg-[#1D1D1F] hover:bg-black active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none rounded-2xl shadow-lg transition-all"
              >
                <Play className="w-5 h-5 fill-white text-white" />
                Tek Tıkla Toplu Mail Gönder ({matchedTeachers} Öğretmen)
              </button>
            ) : (
              <button
                onClick={onPauseBulkSend}
                className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.98] rounded-2xl shadow-lg transition-all"
              >
                <Pause className="w-5 h-5 fill-white text-white" />
                Gönderimi Duraklat
              </button>
            )}

            {sentCount > 0 && (
              <button
                onClick={onResetSendStatus}
                className="px-4 py-3.5 text-sm font-semibold text-[#86868B] hover:text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-2xl transition-all"
                title="Gönderim durumlarını sıfırla"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bento Tile (5 cols): Smart Import Dropzone */}
        <div className="lg:col-span-5 p-6 sm:p-7 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Akıllı İçe Aktarma
              </span>
              <span className="text-[11px] text-[#86868B]">PDF / Bilsa / DaVinci</span>
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F]">
              Ders Programı PDF Yükle
            </h3>
            <p className="text-xs text-[#86868B] leading-relaxed">
              Tüm okulun ders programı çıktısını içeren çok sayfalı PDF dosyasını buraya bırakın. Otomatik taranır.
            </p>
          </div>

          {/* Dropzone container */}
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const fakeEvent = {
                  target: { files: e.dataTransfer.files },
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                onFileUpload(fakeEvent);
              }
            }}
            className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
              isDragOver
                ? 'border-purple-600 bg-purple-50/50'
                : 'border-[#D1D1D6] hover:border-purple-500 bg-[#F9F9FB] hover:bg-purple-50/20'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-[#E5E5EA] flex items-center justify-center text-purple-600 mb-2">
              <FileUp className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-[#1D1D1F] text-center">
              PDF Dosyasını Sürükleyin veya Seçin
            </p>
            <span className="text-[11px] text-[#86868B] mt-0.5">
              .pdf formatında ders dağıtım çıktısı
            </span>
            <input
              type="file"
              accept=".pdf"
              onChange={onFileUpload}
              className="hidden"
            />
          </label>

          <div className="flex items-center justify-between text-xs text-[#86868B] pt-1">
            <span>Yüklenen: <strong>{schedulePages.length} Sayfa Ayrıştırıldı</strong></span>
            <button
              onClick={() => setActiveTab('schedule')}
              className="text-purple-600 font-semibold hover:underline"
            >
              Önizle →
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid: Row 3 - Verification & Attention Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Review Required Warnings */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Manuel Güvence
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1D1D1F]">
              Manuel Kontrol Gerekenler ({unmatchedTeachers.length})
            </h4>
            <p className="text-xs text-[#86868B] mt-1">
              Program sayfasında tam isim eşleşmeyen veya rehberde maili eksik öğretmenler.
            </p>
          </div>

          <div className="space-y-2">
            {unmatchedTeachers.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#F9F9FB] border border-[#E5E5EA] text-xs"
              >
                <div className="truncate">
                  <div className="font-semibold text-[#1D1D1F] truncate">{t.fullName}</div>
                  <div className="text-[11px] text-[#86868B]">{t.branch}</div>
                </div>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="shrink-0 px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-100/80 hover:bg-amber-200 rounded-lg transition-colors"
                >
                  Sayfa Eşle
                </button>
              </div>
            ))}
            {unmatchedTeachers.length === 0 && (
              <div className="py-4 text-center text-xs text-emerald-600 font-medium">
                ✓ Tüm öğretmenler program sayfalarıyla başarıyla eşleşti!
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Email Template Overview */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Şablonu Düzenle
            </button>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1D1D1F]">
              Giden E-posta Tasarımı
            </h4>
            <p className="text-xs text-[#86868B] mt-1">
              Öğretmene gidecek mail başlığı ve kişiselleştirilmiş gövde metni.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F9F9FB] border border-[#E5E5EA] text-xs space-y-1.5">
            <div className="font-mono text-[11px] text-[#1D1D1F] font-semibold truncate">
              {mailTemplate.subject.replace('{ogretmen_adi}', 'Ahmet Yılmaz')}
            </div>
            <div className="text-[#86868B] line-clamp-3 text-[11px]">
              {mailTemplate.bodyText}
            </div>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Kişiye Özel PDF Eki Dahil</span>
            </div>
          </div>
        </div>

        {/* Card 3: Quick Teacher Directory Action */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <CalendarDays className="w-4 h-4" />
            </div>
            <button
              onClick={onOpenTeacherModal}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              + Öğretmen Ekle
            </button>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1D1D1F]">
              Hızlı Rehber Yönetimi
            </h4>
            <p className="text-xs text-[#86868B] mt-1">
              Excel'den öğretmen listesi aktarın veya yenilerini manuel sisteme ekleyin.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <button
              onClick={() => {
                if (onOpenSmartImportModal) {
                  onOpenSmartImportModal();
                } else {
                  setActiveTab('teachers');
                }
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-linear-to-r from-rose-50 to-orange-50 hover:from-rose-100 hover:to-orange-100 border border-rose-200 text-[#1D1D1F] font-semibold transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>Akıllı Rehber Aktar (Word/PDF/Excel)</span>
              </span>
              <ChevronRight className="w-4 h-4 text-rose-600" />
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1D1D1F] font-medium transition-colors"
            >
              <span>Gmail SMTP Bilgilerini Doğrula</span>
              <ChevronRight className="w-4 h-4 text-[#86868B]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
