import React from 'react';
import { 
  X, 
  Sparkles, 
  Layers, 
  Cpu, 
  Mail, 
  ShieldCheck, 
  Smartphone, 
  ArrowRight,
  CheckCircle2,
  Workflow,
  Clock,
  KeyRound
} from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoadmapModal: React.FC<RoadmapModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E5E5EA] overflow-hidden">
        {/* Header Ribbon */}
        <div className="relative px-6 py-6 sm:px-8 bg-linear-to-b from-[#F2F2F7] to-white border-b border-[#E5E5EA] flex items-start justify-between">
          <div className="flex items-center gap-4">
            <SchoolLogo size="lg" />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                20 Yıllık Kıdemli Geliştirici & UI/UX Direktörü Perspektifi
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1D1D1F] tracking-tight">
                TOKİ Cumhuriyet Anadolu Lisesi — Ürün & Mimari Yol Haritası
              </h2>
              <p className="text-xs sm:text-sm text-[#86868B]">
                Okul Yönetimleri İçin Yüksek Güvenilirlikli, Sıfır Veri Sızıntılı Ders Programı Otomasyonu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#E5E5EA] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Apple Bento Cards */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Executive Summary Quote */}
          <div className="p-5 rounded-2xl bg-linear-to-r from-rose-50/70 via-orange-50/40 to-white border border-rose-100 text-sm text-[#1D1D1F] leading-relaxed">
            <p className="font-semibold text-rose-900 mb-1">
              "Bir okul yöneticisinin en büyük kâbusu, 80 sayfalık ders programı PDF'ini elle sayfalarına bölüp 80 ayrı öğretmene tek tek mail atmaktır (yaklaşık 3-4 saatlik insan hatasına açık bir süreç). Bu mimari, bu süreci 30 saniyeye ve tek bir onaya indirir."
            </p>
            <p className="text-xs text-rose-700">
              — Sistem Başmimarı & Kıdemli UI Tasarımcısı Değerlendirmesi
            </p>
          </div>

          {/* Phase 1: Smart Parsing & Splitting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#F9F9FB] border border-[#E5E5EA] hover:border-[#D1D1D6] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1D1D1F]">1. Akıllı PDF Ayrıştırma & OCR</h4>
                  <span className="text-[11px] text-[#86868B]">Bilsa, DaVinci, e-Okul ve ASC Uyumlu</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-[#48484A]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>"Sayın" Token Taraması:</strong> Her sayfadaki metin blokları taranır; "Sayın [Ad Soyad]" ve varyantları Türk alfabesi duyarlılığıyla çekilir.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Sayfa Başına PDF İzolasyonu (pdf-lib):</strong> 80 sayfalık dosya taranırken her öğretmen için bağımsız 1 sayfalık hafif PDF üretilir.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Manuel Güvence Bariyeri:</strong> Güven skoru %90'ın altındaki sayfalar "İnceleme Gerektirir" olarak işaretlenir, yönetici tek tıkla seçer.</span>
                </li>
              </ul>
            </div>

            {/* Phase 2: Teacher Directory & Matching */}
            <div className="p-5 rounded-2xl bg-[#F9F9FB] border border-[#E5E5EA] hover:border-[#D1D1D6] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1D1D1F]">2. Esnek Öğretmen Rehberi</h4>
                  <span className="text-[11px] text-[#86868B]">Excel, CSV, Word veya Manuel Tablo</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-[#48484A]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>Sürükle-Bırak Excel İçe Aktarımı:</strong> Okul idaresi mevcut öğretmen listesini `.xlsx` ya da `.csv` olarak bıraktığında otomatik eşlenir.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>Levenshtein & Diakritik Toleransı:</strong> "İSMAİL ÇETİN" ile "İsmail Çetin" veya unvan ekleri sorunsuz eşleşir.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>Yerel Kalıcılık (Local Cache):</strong> İdare listeyi bir kez girdiğinde tarayıcıda veya sunucuda güvenle saklanır, tekrar girilmesi gerekmez.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Phase 3: Gmail SMTP Architecture */}
          <div className="p-5 rounded-2xl bg-[#F9F9FB] border border-[#E5E5EA]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1D1D1F]">3. Kurumsal Gmail SMTP & Spam Koruması</h4>
                <span className="text-[11px] text-[#86868B]">Google App Password & Hız Limitleri (Rate Limiting)</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#48484A]">
              <div className="p-3 bg-white rounded-xl border border-[#E5E5EA]">
                <div className="flex items-center gap-1.5 font-bold text-[#1D1D1F] mb-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  Uygulama Şifresi
                </div>
                Google hesap güvenliği için ana şifre yerine 16 haneli Gmail "Uygulama Şifresi" kullanılır. 2FA açıkken dahi sorunsuz çalışır.
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#E5E5EA]">
                <div className="flex items-center gap-1.5 font-bold text-[#1D1D1F] mb-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Akıllı Gecikme (1.5 sn)
                </div>
                Google'ın dakikalık ve günlük (500-2000) SMTP limitlerini aşmamak için arka plan kuyruğu mailler arasına 1.5 sn gecikme koyar.
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#E5E5EA]">
                <div className="flex items-center gap-1.5 font-bold text-[#1D1D1F] mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  KVKK & Gizlilik
                </div>
                Her öğretmen sadece kendi sayfasını görür. Toplu listede kimse başkasının programına ve e-postasına maruz kalmaz.
              </div>
            </div>
          </div>

          {/* Phase 4: Desktop & Cross Platform Architecture */}
          <div className="p-5 rounded-2xl bg-linear-to-r from-slate-900 to-zinc-900 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">4. Masaüstü Uygulaması (Desktop App) Yol Haritası</h4>
                  <span className="text-[11px] text-zinc-400">Windows / macOS Masaüstü Kurulumu (Tauri & Electron)</span>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40">
                Önerilen Dağıtım
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed mb-3">
              Bu web uygulaması modern <strong>PWA (Progressive Web App)</strong> olarak tek tıkla masaüstüne yüklenebilir. Ayrıca okul idare bilgisayarlarında çevrimdışı çalışma ve dosya sistemi erişimi için <strong>Tauri (Rust)</strong> veya <strong>Electron</strong> ile <code>TokiMailApp.exe</code> ve <code>.dmg</code> olarak 5 dakikada paketlenebilir.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] text-zinc-300">
              <span className="px-2 py-1 rounded-md bg-white/10">✓ Çift Tıkla Çalışan Masaüstü İkonu</span>
              <span className="px-2 py-1 rounded-md bg-white/10">✓ Okul Yerel Ağında Sıfır Veri Çıkışı</span>
              <span className="px-2 py-1 rounded-md bg-white/10">✓ Canlı Gönderim Durum Raporu İhracı (.xlsx)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F2F2F7] border-t border-[#E5E5EA] flex items-center justify-between">
          <span className="text-xs text-[#86868B]">
            Versiyon: 1.0.0 — Üretim Ortamı Hazır
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#1D1D1F] hover:bg-black rounded-xl active:scale-95 transition-all shadow-sm"
          >
            Anladım, Uygulamayı Kullan
          </button>
        </div>
      </div>
    </div>
  );
};
