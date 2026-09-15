import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Search, 
  Eye, 
  Download, 
  Send, 
  RefreshCw, 
  ExternalLink,
  Edit3,
  Check,
  Trash2
} from 'lucide-react';
import { SchedulePage, Teacher } from '../types';
import { generateTeacherTimetablePdf } from '../utils/pdfProcessor';

import { base64ToUint8Array } from '../utils/base64Helper';

interface ScheduleParserViewProps {
  schedulePages: SchedulePage[];
  teachers: Teacher[];
  onManualMatchPage: (pageNumber: number, teacherId: string) => void;
  onSendSingleMail: (teacher: Teacher, page: SchedulePage) => Promise<void>;
  onPreviewPage: (page: SchedulePage) => void;
  onClearSchedules: () => void;
}

export const ScheduleParserView: React.FC<ScheduleParserViewProps> = ({
  schedulePages,
  teachers,
  onManualMatchPage,
  onSendSingleMail,
  onPreviewPage,
  onClearSchedules,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [editingPageNo, setEditingPageNo] = useState<number | null>(null);
  const [selectedTeacherIdForEdit, setSelectedTeacherIdForEdit] = useState('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<number | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Filter logic
  const filteredPages = schedulePages.filter((page) => {
    const matchedTeacher = teachers.find((t) => t.id === page.matchedTeacherId);
    const searchTarget = `${page.pageNumber} ${page.detectedName || ''} ${page.cleanedName || ''} ${matchedTeacher?.fullName || ''} ${matchedTeacher?.branch || ''}`.toLowerCase();
    const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'matched') return page.status === 'matched' && page.matchedTeacherId;
    if (filterStatus === 'unmatched') return page.status !== 'matched' || !page.matchedTeacherId;
    return true;
  });

  const handleDownloadSinglePdf = async (page: SchedulePage) => {
    const teacher = teachers.find((t) => t.id === page.matchedTeacherId);
    const name = teacher?.fullName || page.cleanedName || `Ogretmen_Sayfa_${page.pageNumber}`;
    setIsDownloadingPdf(page.pageNumber);
    try {
      if (!page.pdfPageData) {
        alert('Bu sayfanın orijinal PDF verisi bulunamadı.');
        return;
      }
      const pdfBytes = base64ToUint8Array(page.pdfPageData);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/\s+/g, '_')}_Ders_Programi_Sayfa_${page.pageNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF indirme hatası:', err);
    } finally {
      setIsDownloadingPdf(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
              1 PDF Sayfası = 1 Öğretmen İlkesi
            </span>
            <span className="text-xs text-[#86868B]">Toplam {schedulePages.length} Sayfa = {teachers.length} Öğretmen</span>
          </div>
          <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
            Ders Programı PDF Ayrıştırma & "Sayın" Başlık Eşleme
          </h2>
          <p className="text-xs sm:text-sm text-[#86868B] mt-1 max-w-2xl">
            Her PDF sayfasındaki <strong>"Sayın [Öğretmen Adı Soyadı]"</strong> taranarak öğretmen rehberindeki e-posta adresleri ile 1:1 ilişkilendirildi. Dilerseniz sayfaları tekil olarak önizleyebilir veya eşleşmeleri manuel değiştirebilirsiniz.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {schedulePages.length > 0 && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
              title="Tüm Sayfaları Temizle"
            >
              <Trash2 className="w-4 h-4" />
              Tümünü Temizle
            </button>
          )}

          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]" />
            <input
              type="text"
              placeholder="Öğretmen veya sayfa ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F2F2F7] border border-transparent focus:border-rose-500 focus:bg-white outline-none transition-all"
            />
          </div>

          <div className="inline-flex p-1 bg-[#F2F2F7] rounded-xl border border-[#E5E5EA] text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterStatus === 'all' ? 'bg-white text-[#1D1D1F] shadow-xs font-bold' : 'text-[#86868B]'
              }`}
            >
              Tümü ({schedulePages.length})
            </button>
            <button
              onClick={() => setFilterStatus('matched')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterStatus === 'matched' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-[#86868B]'
              }`}
            >
              Eşleşenler
            </button>
            <button
              onClick={() => setFilterStatus('unmatched')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterStatus === 'unmatched' ? 'bg-white text-amber-700 shadow-xs font-bold' : 'text-[#86868B]'
              }`}
            >
              Eşleşmeyenler
            </button>
          </div>
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPages.map((page) => {
          const matchedTeacher = teachers.find((t) => t.id === page.matchedTeacherId);
          const isMatched = Boolean(matchedTeacher);
          const isEditingThis = editingPageNo === page.pageNumber;

          return (
            <div
              key={page.pageNumber}
              className={`p-5 rounded-3xl bg-white border transition-all hover:shadow-md flex flex-col justify-between space-y-4 ${
                isMatched ? 'border-[#E5E5EA]' : 'border-amber-300 bg-amber-50/10'
              }`}
            >
              {/* Card Top: Page Number Badge & Match Confidence */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#F2F2F7] font-bold text-xs flex items-center justify-center text-[#1D1D1F] border border-[#E5E5EA]">
                    #{page.pageNumber}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-[#86868B]">PDF Sayfası</span>
                    <div className="text-[11px] text-[#48484A] font-mono">
                      {page.confidence}% Tespit Doğruluğu
                    </div>
                  </div>
                </div>

                {isMatched ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Eşleşti
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertCircle className="w-3 h-3" />
                    İnceleme Gerekli
                  </span>
                )}
              </div>

              {/* Detected Text in Schedule Output */}
              <div className="p-3 rounded-2xl bg-[#F9F9FB] border border-[#E5E5EA] text-xs space-y-1">
                <div className="text-[11px] text-[#86868B] font-medium">
                  Algılanan Belge Başlığı ("Sayın ..."):
                </div>
                <div className="font-bold text-[#1D1D1F] text-sm">
                  {page.detectedName ? `Sayın ${page.detectedName}` : 'Başlık Tespit Edilemedi'}
                </div>
                {page.scheduleTitle && (
                  <div className="text-[11px] text-[#48484A] truncate">
                    {page.scheduleTitle}
                  </div>
                )}
              </div>

              {/* Matched Teacher Info or Manual Selector */}
              <div className="text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#86868B]">
                  <span>Eşleşen Öğretmen & Mail:</span>
                  <button
                    onClick={() => {
                      if (isEditingThis) {
                        setEditingPageNo(null);
                      } else {
                        setEditingPageNo(page.pageNumber);
                        setSelectedTeacherIdForEdit(page.matchedTeacherId || '');
                      }
                    }}
                    className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    {isEditingThis ? 'İptal' : 'Değiştir'}
                  </button>
                </div>

                {(page.exactHours || page.exactClass) && (
                  <div className="flex items-center gap-2 mb-2">
                    {page.exactHours && (
                      <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                        {page.exactHours} Saat
                      </span>
                    )}
                    {page.exactClass && (
                      <span className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                        Sınıf Öğretmenliği: {page.exactClass}
                      </span>
                    )}
                  </div>
                )}

                {isEditingThis ? (
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 space-y-2 animate-in fade-in">
                    <select
                      value={selectedTeacherIdForEdit}
                      onChange={(e) => setSelectedTeacherIdForEdit(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-white border border-[#D1D1D6] focus:border-blue-500 outline-none"
                    >
                      <option value="">-- Öğretmen Seçiniz --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({t.branch})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (selectedTeacherIdForEdit) {
                          onManualMatchPage(page.pageNumber, selectedTeacherIdForEdit);
                          setEditingPageNo(null);
                        }
                      }}
                      disabled={!selectedTeacherIdForEdit}
                      className="w-full py-1.5 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Bu Sayfayı Eşle
                    </button>
                  </div>
                ) : matchedTeacher ? (
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-[#E5E5EA]">
                    <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                      {matchedTeacher.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#1D1D1F] truncate">
                        {matchedTeacher.fullName}
                      </div>
                      <div className="text-[11px] text-[#86868B] truncate font-mono">
                        {matchedTeacher.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 text-[11px] font-medium">
                    Otomatik eşleşme bulunamadı. Lütfen "Değiştir" butonuna tıklayarak öğretmen seçiniz.
                  </div>
                )}
              </div>

              {/* Bottom Card Actions: Preview & Download Single PDF */}
              <div className="pt-2 border-t border-[#F2F2F7] flex items-center justify-between gap-2">
                <button
                  onClick={() => onPreviewPage(page)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-xl active:scale-95 transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-[#86868B]" />
                  Önizle
                </button>

                <button
                  onClick={() => handleDownloadSinglePdf(page)}
                  disabled={isDownloadingPdf === page.pageNumber}
                  className="inline-flex items-center justify-center p-2 text-xs font-semibold text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-xl active:scale-95 transition-all"
                  title="Tek Sayfalık PDF İndir"
                >
                  <Download className="w-3.5 h-3.5 text-[#86868B]" />
                </button>

                {matchedTeacher && (
                  <button
                    onClick={() => onSendSingleMail(matchedTeacher, page)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-[#1D1D1F] hover:bg-black rounded-xl active:scale-95 transition-all"
                    title="Yalnızca bu öğretmene gönder"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Gönder
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Clear All Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#E5E5EA] overflow-hidden p-6 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F] mb-2">
              Tümünü Temizle
            </h3>
            <p className="text-sm text-[#86868B] mb-6">
              Tüm PDF sayfalarını ve eşleşmeleri temizlemek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 py-2.5 text-sm font-semibold text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-xl transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  onClearSchedules();
                  setIsClearModalOpen(false);
                }}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
              >
                Evet, Temizle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
