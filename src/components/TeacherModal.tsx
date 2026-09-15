import React, { useState, useEffect } from 'react';
import { X, User, Mail, BookOpen, Phone, Clock, FileText } from 'lucide-react';
import { Teacher } from '../types';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (teacherData: Partial<Teacher>) => void;
  editingTeacher?: Teacher | null;
  totalPages?: number;
  availableBranches?: string[];
}

export const TeacherModal: React.FC<TeacherModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTeacher,
  totalPages = 15,
  availableBranches,
}) => {
  const [fullName, setFullName] = useState('');
  const [branch, setBranch] = useState('Matematik');
  const [customBranch, setCustomBranch] = useState('');
  const [isCustomBranchMode, setIsCustomBranchMode] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [weeklyHours, setWeeklyHours] = useState<number | ''>('');
  const [matchedPageNumber, setMatchedPageNumber] = useState<number | undefined>(undefined);

  const defaultBranches = [
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

  const branchList = Array.from(
    new Set([...(availableBranches || []), ...defaultBranches])
  );

  useEffect(() => {
    if (editingTeacher) {
      setFullName(editingTeacher.fullName || '');
      const teacherBranch = editingTeacher.branch || 'Genel';
      if (branchList.includes(teacherBranch)) {
        setBranch(teacherBranch);
        setIsCustomBranchMode(false);
      } else {
        setBranch('custom');
        setCustomBranch(teacherBranch);
        setIsCustomBranchMode(true);
      }
      setEmail(editingTeacher.email || '');
      setPhone(editingTeacher.phone || '');
      setWeeklyHours(editingTeacher.weeklyHours ?? '');
      setMatchedPageNumber(editingTeacher.matchedPageNumber);
    } else {
      setFullName('');
      setBranch('Türk Dili ve Edebiyatı');
      setCustomBranch('');
      setIsCustomBranchMode(false);
      setEmail('');
      setPhone('');
      setWeeklyHours('');
      setMatchedPageNumber(undefined);
    }
  }, [editingTeacher, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      alert('Lütfen öğretmen adını ve e-posta adresini giriniz.');
      return;
    }

    const finalBranch = isCustomBranchMode
      ? customBranch.trim() || 'Genel'
      : branch.trim();

    onSave({
      fullName: fullName.trim(),
      branch: finalBranch,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      weeklyHours: weeklyHours !== '' ? Number(weeklyHours) : undefined,
      matchedPageNumber: matchedPageNumber ? Number(matchedPageNumber) : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E5E5EA] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-[#F2F2F7] border-b border-[#E5E5EA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1D1D1F]">
                {editingTeacher ? 'Öğretmen Bilgilerini Düzenle' : 'Yeni Öğretmen Ekle'}
              </h3>
              <p className="text-xs text-[#86868B]">
                TOKİ Cumhuriyet Anadolu Lisesi Kadrosu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#E5E5EA] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Ad Soyad */}
          <div className="space-y-1">
            <label className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#86868B]" />
              Öğretmen Adı Soyadı *
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Ahmet Yılmaz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] focus:border-rose-500 focus:bg-white outline-none font-medium"
            />
          </div>

          {/* Branş & Haftalık Saat */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#86868B]" />
                Branş / Ders
              </label>
              {!isCustomBranchMode ? (
                <div className="space-y-1.5">
                  <select
                    value={branch}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setIsCustomBranchMode(true);
                        setCustomBranch('');
                      } else {
                        setBranch(e.target.value);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] focus:border-rose-500 focus:bg-white outline-none font-medium"
                  >
                    {branchList.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                    <option value="__new__">+ Yeni Branş Yaz...</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Yeni branş adı"
                    value={customBranch}
                    onChange={(e) => setCustomBranch(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-rose-300 focus:border-rose-500 focus:bg-white outline-none font-medium"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomBranchMode(false);
                      setBranch(branchList[0] || 'Genel');
                    }}
                    className="p-2 text-xs text-[#86868B] hover:text-[#1D1D1F]"
                    title="Listeye dön"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#86868B]" />
                Haftalık Ders Saati
              </label>
              <input
                type="number"
                min="1"
                max="40"
                value={weeklyHours === '' ? '' : weeklyHours}
                onChange={(e) => setWeeklyHours(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] focus:border-rose-500 focus:bg-white outline-none font-medium"
              />
            </div>
          </div>

          {/* E-posta Adresi */}
          <div className="space-y-1">
            <label className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#86868B]" />
              E-posta Adresi (Gmail) *
            </label>
            <input
              type="email"
              required
              placeholder="Örn: ogretmen@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] focus:border-rose-500 focus:bg-white outline-none font-mono"
            />
          </div>

          {/* Telefon & Program Sayfası */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#86868B]" />
                İletişim Telefonu
              </label>
              <input
                type="tel"
                placeholder="05XX XXX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] focus:border-rose-500 focus:bg-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#86868B]" />
                Eşleşen PDF Sayfası
              </label>
              <select
                value={matchedPageNumber || ''}
                onChange={(e) =>
                  setMatchedPageNumber(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] focus:border-rose-500 focus:bg-white outline-none font-medium"
              >
                <option value="">-- Otomatik Algılansın --</option>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p}>
                    Sayfa #{p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E5E5EA] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-xl transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs"
            >
              {editingTeacher ? 'Değişiklikleri Kaydet' : 'Öğretmeni Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
