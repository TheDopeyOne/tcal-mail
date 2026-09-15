import React, { useState } from 'react';
import { X, Download, Send } from 'lucide-react';
import { SchedulePage, Teacher } from '../types';
import { base64ToUint8Array } from '../utils/base64Helper';

interface SchedulePreviewModalProps {
  page: SchedulePage | null;
  teacher?: Teacher;
  onClose: () => void;
  onSendMail?: (teacher: Teacher, page: SchedulePage) => Promise<void>;
}

export const SchedulePreviewModal: React.FC<SchedulePreviewModalProps> = ({
  page,
  teacher,
  onClose,
  onSendMail,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!page) return null;

  const teacherName = teacher?.fullName || page.cleanedName || 'Öğretmen';

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
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
      a.download = `${teacherName.replace(/\s+/g, '_')}_Ders_Programi.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E5E5EA] overflow-hidden flex flex-col h-[90vh]">
        
        {/* Top Modal Controls Bar */}
        <div className="px-6 py-4 bg-[#F2F2F7] border-b border-[#E5E5EA] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white text-[#1D1D1F] border border-[#D1D1D6]">
              Sayfa #{page.pageNumber} Önizleme
            </span>
            <span className="text-xs text-[#86868B]">Orijinal PDF Belgesi</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] bg-white hover:bg-[#E5E5EA] rounded-xl border border-[#D1D1D6] transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#86868B]" />
              {isGenerating ? 'Hazırlanıyor...' : 'PDF İndir'}
            </button>
            {teacher && onSendMail && (
              <button
                onClick={() => onSendMail(teacher, page)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Bu Sayfayı Mail Gönder
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#E5E5EA] rounded-full transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Realistic A4 Document Sheet Visualizer (Embedded PDF) */}
        <div className="flex-1 bg-[#E5E5EA]/40 w-full h-full p-0 flex justify-center">
          {page.pdfPageData ? (
            <iframe
              src={`data:application/pdf;base64,${page.pdfPageData}#toolbar=0`}
              className="w-full h-full rounded-b-3xl border-none shadow-inner bg-white"
              title={`Sayfa ${page.pageNumber}`}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-[#86868B] flex-col gap-3 p-8 text-center">
              <div>⚠️ Bu sayfanın orijinal PDF verisi uygulamada bulunmuyor.</div>
              <div className="text-xs opacity-80">Uygulama yeniden başlatılmış veya sayfalar hafızadan silinmiş olabilir. Lütfen PDF dosyasını tekrar yükleyiniz.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
