import React, { useState, useRef } from 'react';
import { 
  KeyRound, 
  Mail, 
  Server, 
  ShieldCheck, 
  AlertCircle, 
  ExternalLink, 
  Save, 
  Send, 
  Sliders, 
  Eye, 
  EyeOff, 
  HelpCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  Download,
  Upload
} from 'lucide-react';
import { SmtpSettings, MailTemplate } from '../types';
import { SchoolLogo } from './SchoolLogo';

interface SettingsViewProps {
  smtpSettings: SmtpSettings;
  mailTemplate: MailTemplate;
  onSaveSmtpSettings: (settings: SmtpSettings) => void;
  onSaveMailTemplate: (template: MailTemplate) => void;
  onTestSmtpConnection: () => Promise<{ success: boolean; message: string }>;
  onExportBackup?: () => void;
  onImportBackup?: (file: File) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  smtpSettings,
  mailTemplate,
  onSaveSmtpSettings,
  onSaveMailTemplate,
  onTestSmtpConnection,
  onExportBackup,
  onImportBackup,
}) => {
  const [smtpForm, setSmtpForm] = useState<SmtpSettings>(smtpSettings);
  const [templateForm, setTemplateForm] = useState<MailTemplate>(mailTemplate);
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSmtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSmtpSettings(smtpForm);
    onSaveMailTemplate(templateForm);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await onTestSmtpConnection();
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'SMTP sunucusuna bağlanılamadı.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
            Gmail SMTP & E-posta Dağıtım Ayarları
          </h2>
          <p className="text-xs sm:text-sm text-[#86868B] mt-1">
            Okulun resmi Gmail hesabı üzerinden öğretmenlere güvenli ve kotalı e-posta gönderim yapılandırması.
          </p>
        </div>

        {saveSuccessNotice && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Tüm ayarlar başarıyla kaydedildi!
          </div>
        )}
      </div>

      <form onSubmit={handleSmtpSubmit} className="space-y-6">
        {/* Bento Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1 (7 cols): Gmail SMTP Credentials & Server config */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1D1D1F]">
                      Google Gmail SMTP Bağlantısı
                    </h3>
                    <p className="text-[11px] text-[#86868B]">
                      smtp.gmail.com (SSL Port 465 / TLS Port 587)
                    </p>
                  </div>
                </div>

                {/* Simulation Mode Toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs font-semibold text-[#86868B]">Simülasyon Modu:</span>
                  <div
                    onClick={() =>
                      setSmtpForm((prev) => ({
                        ...prev,
                        simulationMode: !prev.simulationMode,
                      }))
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                      smtpForm.simulationMode ? 'bg-amber-500' : 'bg-[#E5E5EA]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                        smtpForm.simulationMode ? 'translate-x-5' : ''
                      }`}
                    />
                  </div>
                </label>
              </div>

              {smtpForm.simulationMode && (
                <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Simülasyon Modu Aktif:</strong> Gerçek Gmail şifresi girmeden tüm süreci, PDF ayrıştırmayı ve kuyruk loglarını güvenle test edebilirsiniz. Canlı mailler için anahtarı kapatıp Gmail Uygulama Şifrenizi giriniz.
                  </div>
                </div>
              )}

              {/* Input Fields */}
              <div className="space-y-4 text-xs">
                {/* Okul Gmail Adresi */}
                <div className="space-y-1">
                  <label className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#86868B]" />
                    Okulun Gmail Adresi *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="tokicumhuriyetanadolulisesi@gmail.com"
                    value={smtpForm.user}
                    onChange={(e) =>
                      setSmtpForm({ ...smtpForm, user: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] focus:border-rose-500 focus:bg-white outline-none font-mono"
                  />
                </div>

                {/* 16 Haneli Google Uygulama Şifresi */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      16 Haneli Gmail Uygulama Şifresi (App Password) *
                    </label>
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>Nasıl Alınır?</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="xxxx xxxx xxxx xxxx"
                      value={smtpForm.appPassword}
                      onChange={(e) =>
                        setSmtpForm({ ...smtpForm, appPassword: e.target.value })
                      }
                      className="w-full p-2.5 pr-10 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] focus:border-rose-500 focus:bg-white outline-none font-mono tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#86868B]">
                    Google hesabınızın normal giriş şifresi değil, 2FA açıkken üretilen 16 karakterli özel uygulama şifresidir.
                  </p>
                </div>

                {/* Gönderici Adı & Yanıtla */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#1D1D1F]">
                      Görünen Gönderici Adı (From Name)
                    </label>
                    <input
                      type="text"
                      value={smtpForm.senderName}
                      onChange={(e) =>
                        setSmtpForm({ ...smtpForm, senderName: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] focus:border-rose-500 focus:bg-white outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#1D1D1F]">
                      Yanıt E-postası (Reply-To)
                    </label>
                    <input
                      type="email"
                      value={smtpForm.replyTo}
                      onChange={(e) =>
                        setSmtpForm({ ...smtpForm, replyTo: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] focus:border-rose-500 focus:bg-white outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Port & Host & Rate Limit Gecikmesi */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#1D1D1F]">SMTP Host</label>
                    <input
                      type="text"
                      readOnly
                      value={smtpForm.host}
                      className="w-full p-2.5 rounded-xl bg-[#E5E5EA]/60 border border-[#E5E5EA] text-[#86868B] font-mono cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#1D1D1F]">Port</label>
                    <input
                      type="number"
                      value={smtpForm.port}
                      onChange={(e) =>
                        setSmtpForm({ ...smtpForm, port: Number(e.target.value) })
                      }
                      className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#1D1D1F] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#86868B]" />
                      Gecikme (sn)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="10"
                      value={smtpForm.delayPerMailSeconds}
                      onChange={(e) =>
                        setSmtpForm({
                          ...smtpForm,
                          delayPerMailSeconds: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Test Button & Diagnostics */}
              <div className="pt-2 border-t border-[#E5E5EA] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] active:scale-95 rounded-xl border border-[#D1D1D6] transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {isTesting ? 'Doğrulanıyor...' : 'Gmail Bağlantısını Test Et'}
                </button>

                {testResult && (
                  <div
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Google App Password Guide (Bento Soft Card) */}
            <div className="p-6 rounded-3xl bg-linear-to-br from-[#F9F9FB] to-white border border-[#E5E5EA] shadow-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[#1D1D1F]">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Google Uygulama Şifresi Nasıl Alınır? (4 Kolay Adım)
              </div>
              <ol className="space-y-2 text-xs text-[#48484A] list-decimal list-inside leading-relaxed">
                <li>
                  Okul Gmail hesabınıza giriş yapıp{' '}
                  <a
                    href="https://myaccount.google.com/security"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline font-semibold"
                  >
                    Google Hesap Güvenliği
                  </a>{' '}
                  sayfasına gidin.
                </li>
                <li>
                  <strong>2 Adımlı Doğrulama</strong>'nın açık olduğundan emin olun.
                </li>
                <li>
                  Arama çubuğuna <strong>"Uygulama Şifreleri"</strong> yazın veya doğrudan Güvenlik altından seçin.
                </li>
                <li>
                  Uygulama adına <code>TOKİ CAL Mail</code> yazıp oluşturulan 16 haneli şifreyi kopyalayıp yukarıdaki kutucuğa yapıştırın.
                </li>
              </ol>
            </div>
          </div>

          {/* Column 2 (5 cols): Email Template Customizer & Live Mobile/Web Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1D1D1F]">
                    E-posta Metin & Şablonu
                  </h3>
                </div>
                <span className="text-[11px] text-[#86868B]">Dinamik Etiketler</span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Konu */}
                <div className="space-y-1">
                  <label className="font-semibold text-[#1D1D1F]">
                    E-posta Konu Satırı
                  </label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, subject: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] focus:border-rose-500 focus:bg-white outline-none font-medium"
                  />
                  <div className="text-[10px] text-[#86868B]">
                    Kullanılabilir etiket: <code>{'{ogretmen_adi}'}</code>
                  </div>
                </div>

                {/* Gövde Metni */}
                <div className="space-y-1">
                  <label className="font-semibold text-[#1D1D1F]">
                    E-posta İçerik Metni
                  </label>
                  <textarea
                    rows={6}
                    value={templateForm.bodyText}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, bodyText: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] focus:border-rose-500 focus:bg-white outline-none leading-relaxed font-sans"
                  />
                </div>

                {/* Alt İmza */}
                <div className="space-y-1">
                  <label className="font-semibold text-[#1D1D1F]">
                    Kurumsal İmza / Alt Bilgi
                  </label>
                  <textarea
                    rows={3}
                    value={templateForm.footerText}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, footerText: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] focus:border-rose-500 focus:bg-white outline-none text-[11px] text-[#86868B]"
                  />
                </div>

                {/* Toggles */}
                <div className="pt-2 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateForm.includeSchoolEmblem}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          includeSchoolEmblem: e.target.checked,
                        })
                      }
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs text-[#1D1D1F] font-medium">
                      E-posta başlığına TOKİ CAL logosunu ekle
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateForm.includePdfAttachment}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          includePdfAttachment: e.target.checked,
                        })
                      }
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs text-[#1D1D1F] font-medium">
                      Öğretmene ait 1 sayfalık PDF'i dosya eki olarak ekle
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Live Email Preview (Apple Mail Card) */}
            <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-xs space-y-3">
              <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider block">
                Öğretmenin Göreceği Canlı E-posta Önizlemesi
              </span>
              <div className="p-4 rounded-2xl bg-[#F9F9FB] border border-[#E5E5EA] space-y-3 text-xs">
                {templateForm.includeSchoolEmblem && (
                  <div className="flex items-center gap-2 pb-2 border-b border-[#E5E5EA]">
                    <SchoolLogo size="sm" />
                    <div>
                      <div className="font-bold text-[#1D1D1F] text-xs">
                        TOKİ Cumhuriyet Anadolu Lisesi
                      </div>
                      <div className="text-[10px] text-[#86868B]">Resmi Bildirim Servisi</div>
                    </div>
                  </div>
                )}
                <div className="font-bold text-[#1D1D1F]">
                  {templateForm.subject.replace('{ogretmen_adi}', 'Ahmet Yılmaz')}
                </div>
                <div className="text-[#48484A] whitespace-pre-line text-[11px] leading-relaxed">
                  {`Sayın Ahmet Yılmaz,\n\n${templateForm.bodyText}`}
                </div>
                {templateForm.includePdfAttachment && (
                  <div className="p-2 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-between text-[11px]">
                    <span className="font-medium text-rose-700">
                      📎 Ahmet_Yilmaz_Ders_Programi.pdf (1 Sayfa)
                    </span>
                    <span className="text-[#86868B]">124 KB</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#E5E5EA] text-[10px] text-[#86868B] whitespace-pre-line">
                  {templateForm.footerText}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Backup & Restore Panel */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#1D1D1F] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-600" />
              Sistem Yedeği ve Geri Yükleme
            </h3>
            <p className="text-xs text-[#86868B] mt-1">
              SMTP ayarları, öğretmen rehberi, eklenen branşlar ve yüklenen son toplu ders programı PDF verilerini içeren tam bir sistem yedeği indirebilir veya mevcut bir yedeği sisteme aktarabilirsiniz.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onExportBackup}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-linear-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 rounded-xl shadow-xs active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              Tüm Sistemi Yedekle (.json)
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] border border-[#D1D1D6] rounded-xl active:scale-95 transition-all"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              Yedekten Geri Yükle
            </button>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onImportBackup) {
                  onImportBackup(file);
                }
                e.target.value = ''; // Reset input
              }}
            />
          </div>
        </div>

        {/* Floating / Sticky Save Action Bar */}
        <div className="p-4 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-between shadow-xl">
          <div className="text-xs text-zinc-300">
            Yapılan değişiklikleri sisteme uygulamak için kaydediniz.
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Tüm Ayarları Kaydet
          </button>
        </div>
      </form>
    </div>
  );
};
