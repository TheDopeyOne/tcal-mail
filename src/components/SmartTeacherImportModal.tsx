import React, { useState, useId } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  HelpCircle, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Search, 
  CheckSquare, 
  Square, 
  ArrowRight, 
  Layers, 
  Tag, 
  Mail, 
  Phone, 
  BookOpen, 
  User, 
  Sliders, 
  ClipboardPaste,
  FileType
} from 'lucide-react';
import { 
  parseDocumentToTable, 
  parsePastedTextToTable, 
  RawTableData, 
  ColumnMapping, 
  ColumnType, 
  ProcessedTeacherCandidate, 
  buildTeacherCandidatesFromMappings 
} from '../utils/universalDocumentParser';
import { 
  formatTurkishName, 
  toTurkishBranchCase, 
  cleanAndFormatPhone, 
  cleanEmail 
} from '../utils/textMatcher';
import { Teacher } from '../types';

interface SmartTeacherImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTeachers: Teacher[];
  existingBranches: string[];
  onConfirmImport: (
    importedTeachers: Omit<Teacher, 'id' | 'status'>[],
    newBranches: string[],
    mode: 'append' | 'replace'
  ) => void;
}

export const SmartTeacherImportModal: React.FC<SmartTeacherImportModalProps> = ({
  isOpen,
  onClose,
  existingTeachers,
  existingBranches,
  onConfirmImport,
}) => {
  const branchDatalistId = useId();
  // Tab state: 'upload' | 'paste'
  const [inputTab, setInputTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parsed table state
  const [tableData, setTableData] = useState<RawTableData | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  const [applyTurkishCasing, setApplyTurkishCasing] = useState(true);

  // Processed editable rows
  const [candidates, setCandidates] = useState<ProcessedTeacherCandidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  // Active view step: 'input' | 'review'
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [isMappingExpanded, setIsMappingExpanded] = useState(false);

  if (!isOpen) return null;

  // Handle file selection (Excel, Word, PDF, CSV)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const parsed = await parseDocumentToTable(file);
      setTableData(parsed);
      setColumnMappings(parsed.columnMappings);
      setHasHeaderRow(parsed.hasHeaderRow);

      const generatedCandidates = buildTeacherCandidatesFromMappings(
        parsed.rawRows,
        parsed.columnMappings,
        parsed.hasHeaderRow,
        existingTeachers,
        existingBranches,
        applyTurkishCasing
      );

      setCandidates(generatedCandidates);
      setStep('review');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Dosya ayrıştırılırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  // Handle pasted text parse
  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Lütfen önce yapıştırılacak metin veya tablo verisi giriniz.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const parsed = parsePastedTextToTable(pastedText);
      setTableData(parsed);
      setColumnMappings(parsed.columnMappings);
      setHasHeaderRow(parsed.hasHeaderRow);

      const generatedCandidates = buildTeacherCandidatesFromMappings(
        parsed.rawRows,
        parsed.columnMappings,
        parsed.hasHeaderRow,
        existingTeachers,
        existingBranches,
        applyTurkishCasing
      );

      setCandidates(generatedCandidates);
      setStep('review');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Metin ayrıştırılırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load sample demo data
  const handleLoadDemoData = (type: 'separate_names' | 'mixed_case' | 'word_table') => {
    let demoText = '';
    if (type === 'separate_names') {
      demoText = `Ad\tSoyad\tBranş\tE-posta\tTelefon\tDers Saati
Ahmet\tYılmaz\tTürk Dili ve Edebiyatı\tahmet.yilmaz@gmail.com\t0532 411 22 33\t24
Ayşe\tKaya\tMatematik\tayse.kaya@gmail.com\t0544 522 33 44\t26
Mehmet\tÖztürk\tFizik\tmehmet.ozturk@gmail.com\t0555 633 44 55\t22
Görkem\tTekin\tGörsel Sanatlar\tgorkem.tekin@gmail.com\t0533 111 22 33\t20
Seda\tAksoy\tBilişim Teknolojileri\tseda.aksoy@gmail.com\t0542 999 88 77\t22`;
    } else if (type === 'mixed_case') {
      demoText = `Öğretmen Adı Soyadı\tBranşı\tGmail Adresi\tİletişim Tel
ŞÜKRÜ GÜLBAHAR\tTÜRK DİLİ VE EDEBİYATI\tsukru.gulbahar@gmail.com\t0533 123 45 67
iPEK çELİK\tKİMYA\tipek.celik@gmail.com\t0542 234 56 78
öMER CEVAHİR\tMATEMATİK\tomercevahir84@gmail.com\t0505 345 67 89
IŞIK KAYA\tFELSEFE\tisik.kaya@gmail.com\t0535 456 78 90
barış arslan\tMÜZİK\tbaris.arslan@gmail.com\t0554 567 89 01`;
    } else {
      demoText = `Ad Soyad\tBranş\tE-posta\tTelefon
Hasan Basri Çelik\tTarih\thasan.celik@gmail.com\t0532 888 77 66
Elif Nur Şahin\tBiyoloji\telif.sahin@gmail.com\t0544 777 66 55
Cemile Koçak\tAlmanca\tcemile.kocak@gmail.com\t0555 666 55 44
Burak Demir\tBeden Eğitimi\tburak.demir@gmail.com\t0533 555 44 33`;
    }

    setPastedText(demoText);
    setInputTab('paste');
  };

  // Re-run candidate generation when mappings or casing options change
  const handleRebuildCandidates = (
    newMappings: ColumnMapping[],
    newHasHeader: boolean,
    newTurkishCasing: boolean
  ) => {
    if (!tableData) return;
    const regenerated = buildTeacherCandidatesFromMappings(
      tableData.rawRows,
      newMappings,
      newHasHeader,
      existingTeachers,
      existingBranches,
      newTurkishCasing
    );
    setCandidates(regenerated);
  };

  // Update single column mapping
  const handleColumnTypeChange = (colIndex: number, newType: ColumnType) => {
    const updated = columnMappings.map((m) =>
      m.columnIndex === colIndex ? { ...m, detectedType: newType } : m
    );
    setColumnMappings(updated);
    handleRebuildCandidates(updated, hasHeaderRow, applyTurkishCasing);
  };

  // Update a single candidate field
  const handleCandidateChange = (
    tempId: string,
    field: keyof ProcessedTeacherCandidate,
    value: any
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.tempId !== tempId) return c;
        const updated = { ...c, [field]: value };

        // Realtime validation
        if (field === 'email') {
          const emailVal = cleanEmail(String(value));
          if (!emailVal || !emailVal.includes('@')) {
            updated.validationStatus = 'warning';
            updated.validationMessage = 'E-posta eksik veya hatalı formatta';
          } else {
            updated.validationStatus = 'valid';
            updated.validationMessage = undefined;
          }
        }

        if (field === 'fullName' && applyTurkishCasing) {
          updated.fullName = formatTurkishName(String(value));
        }

        if (field === 'branch' && applyTurkishCasing) {
          updated.branch = toTurkishBranchCase(String(value));
        }

        return updated;
      })
    );
  };

  // Toggle selection for all filtered candidates
  const handleToggleSelectAll = () => {
    const allSelected = candidates.every((c) => c.selected);
    setCandidates((prev) => prev.map((c) => ({ ...c, selected: !allSelected })));
  };

  // Delete candidate row
  const handleDeleteRow = (tempId: string) => {
    setCandidates((prev) => prev.filter((c) => c.tempId !== tempId));
  };

  // Add a blank row
  const handleAddNewRow = () => {
    const newCand: ProcessedTeacherCandidate = {
      tempId: `candidate-new-${Date.now()}`,
      selected: true,
      fullName: 'Yeni Öğretmen',
      email: '',
      branch: 'Genel',
      phone: '',
      weeklyHours: 22,
      validationStatus: 'warning',
      validationMessage: 'E-posta adresi giriniz',
      originalRowIndex: candidates.length,
    };
    setCandidates((prev) => [newCand, ...prev]);
  };

  // Auto-fill missing emails with a clean domain pattern
  const handleAutoFillMissingEmails = () => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.email && c.email.includes('@')) return c;
        const slug = c.fullName
          .toLocaleLowerCase('tr-TR')
          .replace(/ç/g, 'c')
          .replace(/ğ/g, 'g')
          .replace(/ı/g, 'i')
          .replace(/ö/g, 'o')
          .replace(/ş/g, 's')
          .replace(/ü/g, 'u')
          .replace(/[^a-z0-9]/g, '.')
          .replace(/\.+/g, '.');
        const generatedEmail = `${slug}@gmail.com`;
        return {
          ...c,
          email: generatedEmail,
          validationStatus: 'valid',
          validationMessage: undefined,
        };
      })
    );
  };

  // Re-apply Turkish Casing to all current candidates
  const handleReapplyTurkishCasing = () => {
    setCandidates((prev) =>
      prev.map((c) => ({
        ...c,
        fullName: formatTurkishName(c.fullName),
        branch: toTurkishBranchCase(c.branch),
        phone: cleanAndFormatPhone(c.phone),
        email: cleanEmail(c.email),
      }))
    );
  };

  // Extract detected distinct branches
  const detectedBranches: string[] = Array.from(
    new Set<string>(candidates.filter((c) => c.selected && c.branch).map((c) => c.branch))
  ).filter(Boolean);

  const newBranchesToCreate = detectedBranches.filter(
    (b) => !existingBranches.some((eb) => eb.toLowerCase() === b.toLowerCase())
  );

  // Filtered rows for display
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = `${c.fullName} ${c.email} ${c.branch} ${c.phone}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranchFilter === 'all' || c.branch === selectedBranchFilter;
    return matchesSearch && matchesBranch;
  });

  const selectedCount = candidates.filter((c) => c.selected).length;
  const warningCount = candidates.filter((c) => c.selected && c.validationStatus === 'warning').length;

  // Final confirmation
  const handleConfirm = () => {
    const chosen = candidates.filter((c) => c.selected);
    if (chosen.length === 0) {
      alert('Lütfen içe aktarmak için en az bir öğretmen seçiniz.');
      return;
    }

    const payload: Omit<Teacher, 'id' | 'status'>[] = chosen.map((c) => ({
      fullName: formatTurkishName(c.fullName),
      email: cleanEmail(c.email),
      branch: toTurkishBranchCase(c.branch || 'Genel'),
      phone: cleanAndFormatPhone(c.phone),
      weeklyHours: c.weeklyHours || 22,
    }));

    onConfirmImport(payload, newBranchesToCreate, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-[#E5E5EA] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#F2F2F7] border-b border-[#E5E5EA] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1D1D1F]">
                  Akıllı Öğretmen & E-posta Rehberi Aktarımı
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider">
                  Word • PDF • Excel • CSV
                </span>
              </div>
              <p className="text-xs text-[#86868B] mt-0.5">
                Büyük/küçük harf & TR karakter algılama, akıllı sütun eşleştirme ve canlı düzeltme masası
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

        {/* Error message banner if any */}
        {errorMessage && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="font-semibold hover:underline">
              Kapat
            </button>
          </div>
        )}

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {step === 'input' ? (
            /* ================= STEP 1: SOURCE SELECTION & UPLOAD ================= */
            <div className="space-y-6">
              {/* Tab Selector: Upload or Paste */}
              <div className="flex items-center justify-center">
                <div className="bg-[#F2F2F7] p-1 rounded-2xl flex items-center gap-1 border border-[#E5E5EA]">
                  <button
                    onClick={() => setInputTab('upload')}
                    className={`flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl transition-all ${
                      inputTab === 'upload'
                        ? 'bg-white text-[#1D1D1F] shadow-xs'
                        : 'text-[#86868B] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-rose-600" />
                    <span>Dosya Yükle (Excel, Word, PDF, CSV)</span>
                  </button>
                  <button
                    onClick={() => setInputTab('paste')}
                    className={`flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl transition-all ${
                      inputTab === 'paste'
                        ? 'bg-white text-[#1D1D1F] shadow-xs'
                        : 'text-[#86868B] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <ClipboardPaste className="w-4 h-4 text-rose-600" />
                    <span>Metin / Tablo Yapıştır</span>
                  </button>
                </div>
              </div>

              {inputTab === 'upload' ? (
                /* File Dropzone */
                <div className="space-y-4">
                  <label className="group relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed border-[#D1D1D6] hover:border-rose-500 rounded-3xl bg-[#F9F9FB] hover:bg-rose-50/20 cursor-pointer transition-all">
                    <div className="w-16 h-16 rounded-3xl bg-white shadow-md border border-[#E5E5EA] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileSpreadsheet className="w-8 h-8 text-rose-600" />
                    </div>
                    <div className="mt-4 text-center">
                    <span className="text-sm font-bold text-[#1D1D1F] group-hover:text-rose-600 transition-colors">
                      {isLoading ? 'Dosya taranıyor ve sütunlar çözümleniyor...' : 'Bir dosya seçin veya buraya sürükleyin'}
                    </span>
                    <p className="text-xs text-[#86868B] mt-1">
                      Desteklenen formatlar: <strong>.xlsx, .xls, .docx (Word), .pdf, .csv</strong>
                    </p>
                  </div>

                  {/* Format Pills */}
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Excel / CSV Tabloları
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-medium">
                      <FileText className="w-3.5 h-3.5" />
                      Word (.docx) Tabloları
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-medium">
                      <FileType className="w-3.5 h-3.5" />
                      PDF Liste & Çizelgeleri
                    </span>
                  </div>

                  <input
                    type="file"
                    accept=".xlsx,.xls,.docx,.pdf,.csv,.tsv"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className="hidden"
                  />
                </label>

                {/* Smart Features Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#F2F2F7] border border-[#E5E5EA] text-xs space-y-1">
                    <div className="font-bold text-[#1D1D1F] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                      Büyük/Küçük & TR Karakter
                    </div>
                    <p className="text-[#86868B]">
                      "ŞÜKRÜ GÜLBAHAR" veya "ahmet yılmaz" otomatik olarak "Şükrü Gülbahar" ve "Ahmet Yılmaz" haline getirilir.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F2F2F7] border border-[#E5E5EA] text-xs space-y-1">
                    <div className="font-bold text-[#1D1D1F] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      Ayrı veya Birleşik Sütunlar
                    </div>
                    <p className="text-[#86868B]">
                      "Ad" ve "Soyad" ayrı sütunlarda olsa bile akıllıca tek ad soyad alanına bağlanır; telefon ve branş ayrıştırılır.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F2F2F7] border border-[#E5E5EA] text-xs space-y-1">
                    <div className="font-bold text-[#1D1D1F] flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      Otomatik Branş Kataloğu
                    </div>
                    <p className="text-[#86868B]">
                      Listede tespit edilen tüm yeni branşlar otomatik olarak sistem kataloğuna eklenir ve filtrelere dahil edilir.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Paste Text Area */
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1D1D1F] flex items-center justify-between">
                    <span>Tablo veya Metin Satırlarını Buraya Yapıştırın</span>
                    <span className="text-[11px] text-[#86868B] font-normal">
                      Excel, Word veya web sayfasından kopyalanan hücreler desteklenir
                    </span>
                  </label>
                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Örnek:&#10;Ad&#9;Soyad&#9;Branş&#9;E-posta&#9;Telefon&#10;Ahmet&#9;Yılmaz&#9;Türk Dili ve Edebiyatı&#9;ahmet.yilmaz@gmail.com&#9;0532 411 22 33&#10;Ayşe&#9;Kaya&#9;Matematik&#9;ayse.kaya@gmail.com&#9;0544 522 33 44"
                    className="w-full p-3 font-mono text-xs rounded-2xl bg-[#F9F9FB] border border-[#E5E5EA] focus:border-rose-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-[#86868B]">
                    Sekme (tab), noktalı virgül (;), virgül (,) veya çift boşluklu sütunları otomatik tanır.
                  </div>
                  <button
                    onClick={handleParsePastedText}
                    disabled={isLoading || !pastedText.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs active:scale-95 transition-all"
                  >
                    <span>Tabloyu Çözümle & Düzenleme Masasına Aktar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Quick Demo Templates */}
            <div className="p-4 rounded-2xl bg-[#F9F9FB] border border-[#E5E5EA] space-y-2">
              <div className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#86868B]" />
                Hızlı Test İçin Hazır Şablonlar (1 Tıkla Doldur)
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleLoadDemoData('separate_names')}
                  className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-[#F2F2F7] text-[#1D1D1F] rounded-xl border border-[#D1D1D6] active:scale-95 transition-all"
                >
                  📋 Ayrı Ad & Soyad Sütunlu Örnek
                </button>
                <button
                  onClick={() => handleLoadDemoData('mixed_case')}
                  className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-[#F2F2F7] text-[#1D1D1F] rounded-xl border border-[#D1D1D6] active:scale-95 transition-all"
                >
                  🇹🇷 Büyük/Küçük Türkçe Harfli Kadro (ŞÜKRÜ, İPEK...)
                </button>
                <button
                  onClick={() => handleLoadDemoData('word_table')}
                  className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-[#F2F2F7] text-[#1D1D1F] rounded-xl border border-[#D1D1D6] active:scale-95 transition-all"
                >
                  📝 Standart MEB Ders Çizelgesi Formatı
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ================= STEP 2: COLUMN MAPPING & LIVE EDITABLE REVIEW TABLE ================= */
          <div className="space-y-4">
            {/* Top Toolbar & Summary */}
            <div className="p-4 rounded-2xl bg-[#F2F2F7] border border-[#E5E5EA] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-xs">
                  <span className="text-[#86868B]">Kaynak: </span>
                  <strong className="text-[#1D1D1F]">{tableData?.fileName}</strong>
                </div>
                <span className="text-[#D1D1D6]">•</span>
                <div className="text-xs">
                  <span className="text-[#86868B]">Toplam: </span>
                  <strong className="text-[#1D1D1F]">{candidates.length} Aday</strong>
                </div>
                <span className="text-[#D1D1D6]">•</span>
                <div className="text-xs">
                  <span className="text-[#86868B]">Seçili: </span>
                  <strong className="text-rose-600">{selectedCount} Öğretmen</strong>
                </div>
                {warningCount > 0 && (
                  <>
                    <span className="text-[#D1D1D6]">•</span>
                    <div className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      ⚠️ {warningCount} E-posta Eksik / Kontrol Gerekli
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Re-map Columns Accordion Toggle */}
                <button
                  onClick={() => setIsMappingExpanded(!isMappingExpanded)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    isMappingExpanded
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-white text-[#1D1D1F] border-[#D1D1D6] hover:bg-[#E5E5EA]'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Sütun Eşleştirmesini {isMappingExpanded ? 'Kapat' : 'Düzenle'}</span>
                </button>

                {/* Back to upload */}
                <button
                  onClick={() => setStep('input')}
                  className="px-3 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] rounded-xl hover:bg-[#E5E5EA] transition-colors"
                >
                  Farklı Dosya Seç
                </button>
              </div>
            </div>

            {/* Expandable Column Mapping Box */}
            {isMappingExpanded && (
              <div className="p-4 rounded-2xl bg-white border-2 border-rose-200 shadow-xs space-y-4 animate-in slide-in-from-top duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-rose-600" />
                      Dosya Sütun Eşleştirmesi (Akıllı Algılama)
                    </h4>
                    <p className="text-[11px] text-[#86868B]">
                      Hangi sütunun hangi alana karşılık geldiğini değiştirebilirsiniz. Değişiklikler canlı olarak tabloya yansır.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs font-medium text-[#1D1D1F] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasHeaderRow}
                        onChange={(e) => {
                          setHasHeaderRow(e.target.checked);
                          handleRebuildCandidates(columnMappings, e.target.checked, applyTurkishCasing);
                        }}
                        className="rounded accent-rose-600"
                      />
                      <span>İlk satır başlık mı?</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-[#1D1D1F] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyTurkishCasing}
                        onChange={(e) => {
                          setApplyTurkishCasing(e.target.checked);
                          handleRebuildCandidates(columnMappings, hasHeaderRow, e.target.checked);
                        }}
                        className="rounded accent-rose-600"
                      />
                      <span>Türkçe Harf Düzeltmesi</span>
                    </label>
                  </div>
                </div>

                {/* Column Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {columnMappings.map((m) => (
                    <div
                      key={m.columnIndex}
                      className={`p-2.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                        m.detectedType !== 'ignore'
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-[#F9F9FB] border-[#E5E5EA] opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1D1D1F] truncate" title={m.headerName}>
                          {m.headerName || `Sütun ${m.columnIndex + 1}`}
                        </span>
                        <span className="text-[10px] text-[#86868B]">#{m.columnIndex + 1}</span>
                      </div>

                      <select
                        value={m.detectedType}
                        onChange={(e) => handleColumnTypeChange(m.columnIndex, e.target.value as ColumnType)}
                        className="w-full text-xs py-1.5 px-2 rounded-lg bg-white border border-[#D1D1D6] font-semibold text-[#1D1D1F] outline-none"
                      >
                        <option value="name_combined">👤 Ad Soyad (Birleşik)</option>
                        <option value="first_name">👤 Ad (İlk İsim)</option>
                        <option value="last_name">🏷️ Soyad</option>
                        <option value="email">✉️ E-posta Adresi</option>
                        <option value="branch">📚 Branş / Ders</option>
                        <option value="phone">📱 Telefon</option>
                        <option value="weekly_hours">⏱️ Ders Saati</option>
                        <option value="ignore">✖️ Sütunu Yok Say</option>
                      </select>

                      {/* Sample preview value */}
                      <div className="text-[10px] text-[#86868B] truncate">
                        Örn: {m.sampleValues[0] || 'Boş'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Branch Catalog Banner ("bu branş sutunlarına göre branşlar oluşsun") */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5EA] space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold text-[#1D1D1F]">
                    Tespit Edilen Branşlar ({detectedBranches.length})
                  </span>
                  {newBranchesToCreate.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ✨ {newBranchesToCreate.length} Yeni Branş Kataloğa Eklenecek
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-[#86868B]">
                  Filtrelemek için branşın üzerine tıklayabilirsiniz
                </div>
              </div>

              {/* Branch Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedBranchFilter('all')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                    selectedBranchFilter === 'all'
                      ? 'bg-[#1D1D1F] text-white'
                      : 'bg-[#F2F2F7] text-[#1D1D1F] hover:bg-[#E5E5EA]'
                  }`}
                >
                  Tümü ({candidates.length})
                </button>
                {detectedBranches.map((branch) => {
                  const count = candidates.filter((c) => c.branch === branch).length;
                  const isBrandNew = newBranchesToCreate.includes(branch);
                  return (
                    <button
                      key={branch}
                      onClick={() => setSelectedBranchFilter(branch)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                        selectedBranchFilter === branch
                          ? 'bg-rose-600 text-white'
                          : isBrandNew
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-[#F2F2F7] text-[#1D1D1F] hover:bg-[#E5E5EA]'
                      }`}
                    >
                      <span>{branch}</span>
                      <span className="opacity-70 text-[10px]">({count})</span>
                      {isBrandNew && <span className="text-[9px] font-bold uppercase tracking-wider">YENİ</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Bulk Action Tools */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]" />
                <input
                  type="text"
                  placeholder="Adaylarda isim, e-posta veya branş ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F2F2F7] border border-transparent focus:border-rose-500 focus:bg-white outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleAutoFillMissingEmails}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
                  title="E-postası boş olanlara isim.soyisim@gmail.com formatında mail oluşturur"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Eksik E-postaları Tamamla</span>
                </button>

                <button
                  onClick={handleReapplyTurkishCasing}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-xl border border-[#D1D1D6] transition-colors"
                  title="Tüm isim ve branşları Türkçe büyük/küçük harf standardına göre biçimlendirir"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Türkçe Harfleri Düzenle</span>
                </button>

                <button
                  onClick={handleAddNewRow}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-xl border border-[#D1D1D6] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-rose-600" />
                  <span>Yeni Satır Ekle</span>
                </button>
              </div>
            </div>

            {/* Editable Grid Table */}
            <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden shadow-xs">
              <div className="max-h-[380px] overflow-y-auto overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-[#F9F9FB] border-b border-[#E5E5EA] z-10">
                    <tr className="text-[#86868B] font-semibold">
                      <th className="p-3 w-10">
                        <button
                          onClick={handleToggleSelectAll}
                          className="flex items-center text-[#86868B] hover:text-[#1D1D1F]"
                        >
                          {candidates.every((c) => c.selected) && candidates.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-rose-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3 min-w-[200px]">Öğretmen Adı Soyadı</th>
                      <th className="p-3 min-w-[180px]">Branş / Alan</th>
                      <th className="p-3 min-w-[220px]">E-posta Adresi (Gmail/MEB)</th>
                      <th className="p-3 min-w-[150px]">Telefon</th>
                      <th className="p-3 w-24">Saat</th>
                      <th className="p-3 w-24">Durum</th>
                      <th className="p-3 w-12 text-right">Sil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA]">
                    {filteredCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-xs text-[#86868B]">
                          Arama kriterine uygun öğretmen bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredCandidates.map((candidate, idx) => {
                        const hasEmailWarning = !candidate.email || !candidate.email.includes('@');
                        return (
                          <tr
                            key={candidate.tempId}
                            className={`hover:bg-[#F9F9FB] transition-colors ${
                              !candidate.selected ? 'opacity-40 bg-gray-50' : ''
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={candidate.selected}
                                onChange={(e) =>
                                  handleCandidateChange(candidate.tempId, 'selected', e.target.checked)
                                }
                                className="rounded accent-rose-600 cursor-pointer"
                              />
                            </td>

                            {/* Row Index */}
                            <td className="p-3 text-center text-[#86868B] font-mono text-[11px]">
                              {idx + 1}
                            </td>

                            {/* Full Name Input */}
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={candidate.fullName}
                                onChange={(e) =>
                                  handleCandidateChange(candidate.tempId, 'fullName', e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#F2F2F7] focus:bg-white border border-transparent focus:border-rose-500 font-semibold text-[#1D1D1F] outline-none"
                              />
                            </td>

                            {/* Branch Input */}
                            <td className="p-2.5">
                              <input
                                type="text"
                                list={branchDatalistId}
                                value={candidate.branch}
                                onChange={(e) =>
                                  handleCandidateChange(candidate.tempId, 'branch', e.target.value)
                                }
                                placeholder="Branş seç veya yaz"
                                className="w-full px-2 py-1.5 rounded-lg bg-[#F2F2F7] focus:bg-white border border-transparent focus:border-rose-500 text-[#1D1D1F] outline-none"
                              />
                            </td>

                            {/* Email Input */}
                            <td className="p-2.5">
                              <div className="relative">
                                <input
                                  type="email"
                                  value={candidate.email}
                                  onChange={(e) =>
                                    handleCandidateChange(candidate.tempId, 'email', e.target.value)
                                  }
                                  placeholder="ad.soyad@gmail.com"
                                  className={`w-full px-2 py-1.5 rounded-lg bg-[#F2F2F7] focus:bg-white border text-[#1D1D1F] outline-none ${
                                    hasEmailWarning
                                      ? 'border-amber-400 bg-amber-50/40 text-amber-900'
                                      : 'border-transparent focus:border-rose-500'
                                  }`}
                                />
                                {hasEmailWarning && (
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                )}
                              </div>
                            </td>

                            {/* Phone Input */}
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={candidate.phone}
                                onChange={(e) =>
                                  handleCandidateChange(candidate.tempId, 'phone', e.target.value)
                                }
                                placeholder="05xx xxx xx xx"
                                className="w-full px-2 py-1.5 rounded-lg bg-[#F2F2F7] focus:bg-white border border-transparent focus:border-rose-500 text-[#1D1D1F] outline-none"
                              />
                            </td>

                            {/* Hours Input */}
                            <td className="p-2.5">
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={candidate.weeklyHours}
                                onChange={(e) =>
                                  handleCandidateChange(
                                    candidate.tempId,
                                    'weeklyHours',
                                    parseInt(e.target.value, 10) || 20
                                  )
                                }
                                className="w-16 px-2 py-1.5 text-center rounded-lg bg-[#F2F2F7] focus:bg-white border border-transparent focus:border-rose-500 text-[#1D1D1F] outline-none"
                              />
                            </td>

                            {/* Status Tag */}
                            <td className="p-3">
                              {candidate.isExistingTeacher ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  Güncellenecek
                                </span>
                              ) : hasEmailWarning ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  Mail Eksik
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ✓ Hazır
                                </span>
                              )}
                            </td>

                            {/* Delete Action */}
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleDeleteRow(candidate.tempId)}
                                className="p-1 text-[#86868B] hover:text-rose-600 rounded-lg transition-colors"
                                title="Satırı kaldır"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Datalist for fast branch auto-completion */}
            <datalist id={branchDatalistId}>
              {Array.from(new Set([...existingBranches, ...detectedBranches])).map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>

            {/* Import Strategy Options */}
            <div className="p-4 rounded-2xl bg-[#F9F9FB] border border-[#E5E5EA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#1D1D1F]">Aktarım Tercihi:</span>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#1D1D1F]">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="accent-rose-600"
                    />
                    <span>Mevcut rehbere ekle / eşleşenleri güncelle (Önerilen)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#1D1D1F]">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="accent-rose-600"
                    />
                    <span className="text-rose-700">Mevcut rehberi sil ve sıfırdan oluştur</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 bg-[#F2F2F7] border-t border-[#E5E5EA] flex items-center justify-between shrink-0">
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-[#1D1D1F] hover:bg-[#E5E5EA] rounded-xl transition-colors"
        >
          Vazgeç
        </button>

        {step === 'review' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep('input')}
              className="px-4 py-2 text-xs font-semibold text-[#1D1D1F] bg-white hover:bg-[#E5E5EA] rounded-xl border border-[#D1D1D6] transition-colors"
            >
              Geri (Dosya Seçimi)
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className="inline-flex items-center gap-2 px-6 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {selectedCount} Öğretmeni Rehbere Aktar
                {newBranchesToCreate.length > 0 && ` (${newBranchesToCreate.length} Yeni Branş)`}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
  );
};
