import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  Search, 
  Trash2, 
  Edit, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Send,
  Upload,
  Filter,
  CheckSquare,
  Square,
  FileDown,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Teacher } from '../types';
import { parseTeacherSpreadsheet, exportToExcel } from '../utils/excelParser';

interface TeacherDirectoryViewProps {
  teachers: Teacher[];
  availableBranches?: string[];
  onAddTeacher: (teacher: Omit<Teacher, 'id' | 'status'>) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  onBulkImportTeachers: (newTeachers: Omit<Teacher, 'id' | 'status'>[]) => void;
  onOpenAddModal: () => void;
  onEditTeacher: (teacher: Teacher) => void;
  onOpenSmartImportModal: () => void;
}

export const TeacherDirectoryView: React.FC<TeacherDirectoryViewProps> = ({
  teachers,
  availableBranches = [],
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onBulkImportTeachers,
  onOpenAddModal,
  onEditTeacher,
  onOpenSmartImportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  
  // Custom confirmation modals state
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Extract unique active branches merged with available catalog branches
  const teacherBranches = teachers.map((t) => t.branch).filter(Boolean);
  const allUniqueBranches = Array.from(
    new Set([...teacherBranches, ...availableBranches])
  ).sort((a, b) => a.localeCompare(b, 'tr'));

  const branches = ['all', ...allUniqueBranches];

  // Filtered teachers
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch = `${t.fullName} ${t.email} ${t.branch} ${t.phone || ''}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch === 'all' || t.branch === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  // Handle Excel upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportNotice(null);
    try {
      const parsedRows = await parseTeacherSpreadsheet(file);
      if (parsedRows.length === 0) {
        alert('Dosyada geçerli öğretmen ve e-posta kaydı bulunamadı.');
        return;
      }

      onBulkImportTeachers(
        parsedRows.map((r) => ({
          fullName: r.fullName,
          email: r.email,
          branch: r.branch || 'Genel',
          phone: r.phone || '',
          weeklyHours: 22,
        }))
      );

      setImportNotice(`${parsedRows.length} öğretmen başarıyla Excel'den içe aktarıldı.`);
    } catch (err: any) {
      console.error(err);
      alert('Dosya okunurken bir hata oluştu: ' + (err?.message || 'Geçersiz format'));
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  // Export current list
  const handleExportList = () => {
    const exportData = teachers.map((t) => ({
      'Ad Soyad': t.fullName,
      'Branş': t.branch,
      'E-posta': t.email,
      'Telefon': t.phone || '',
      'Haftalık Ders Saati': t.weeklyHours || 20,
      'Eşleşen Sayfa': t.matchedPageNumber ? `Sayfa ${t.matchedPageNumber}` : 'Eşleşmedi',
      'Son Gönderim': t.lastSentAt || 'Gönderilmedi',
    }));
    exportToExcel(exportData, 'TOKI_CAL_Ogretmen_Rehberi');
  };

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTeachers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTeachers.map((t) => t.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Delete selected
  const handleDeleteSelected = () => {
    setIsBulkDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Controls & Action Deck */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
              Öğretmen & E-posta Rehberi ({teachers.length} Kayıt)
            </h2>
            <p className="text-xs sm:text-sm text-[#86868B] mt-1">
              Ders programları bu rehberdeki isimlerle otomatik eşleştirilir. Excel/CSV yükleyebilir veya manuel düzenleyebilirsiniz.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Smart Import Button (Word, PDF, Excel, CSV) */}
            <button
              onClick={onOpenSmartImportModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-linear-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 rounded-xl shadow-xs active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Akıllı İçe Aktar (Word • PDF • Excel)</span>
            </button>

            {/* Quick Excel/CSV Upload Input */}
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-xl border border-[#D1D1D6] cursor-pointer active:scale-95 transition-all">
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isImporting ? 'Okunuyor...' : 'Hızlı Dosya'}</span>
              <input
                type="file"
                accept=".xlsx,.xls,.docx,.pdf,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Export Button */}
            <button
              onClick={handleExportList}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-xl border border-[#D1D1D6] active:scale-95 transition-all"
              title="Mevcut listeyi Excel olarak indir"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span>Excel İndir</span>
            </button>

            {/* Add Teacher Button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#1D1D1F] bg-white hover:bg-[#F2F2F7] rounded-xl border border-[#D1D1D6] shadow-xs active:scale-95 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 text-rose-600" />
              <span>Manuel Ekle</span>
            </button>
          </div>
        </div>

        {/* Notice alert if imported */}
        {importNotice && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <span>✓ {importNotice}</span>
            <button onClick={() => setImportNotice(null)} className="font-bold hover:underline">
              Kapat
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
            <input
              type="text"
              placeholder="Öğretmen adı, e-posta veya telefon ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#F2F2F7] border border-transparent focus:border-rose-500 focus:bg-white outline-none transition-all"
            />
          </div>

          {/* Branch Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#86868B] shrink-0" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full sm:w-56 text-xs py-2.5 px-3 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] outline-none font-medium text-[#1D1D1F]"
            >
              <option value="all">Tüm Branşlar ({teachers.length} Öğretmen)</option>
              {branches
                .filter((b) => b !== 'all')
                .map((b) => {
                  const branchCount = teachers.filter((t) => t.branch === b).length;
                  return (
                    <option key={b} value={b}>
                      {b} ({branchCount})
                    </option>
                  );
                })}
            </select>
          </div>

          {/* Bulk Selection Actions */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Seçilenleri Sil ({selectedIds.length})</span>
            </button>
          )}
        </div>

        {/* Dynamic Branch Filter Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-[#86868B] whitespace-nowrap flex items-center gap-1 shrink-0">
            <BookOpen className="w-3 h-3 text-rose-600" />
            Branşlar ({allUniqueBranches.length}):
          </span>
          <button
            onClick={() => setSelectedBranch('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
              selectedBranch === 'all'
                ? 'bg-[#1D1D1F] text-white shadow-xs'
                : 'bg-[#F2F2F7] text-[#1D1D1F] hover:bg-[#E5E5EA]'
            }`}
          >
            Tümü ({teachers.length})
          </button>
          {allUniqueBranches.map((b) => {
            const count = teachers.filter((t) => t.branch === b).length;
            const isSelected = selectedBranch === b;
            return (
              <button
                key={b}
                onClick={() => setSelectedBranch(isSelected ? 'all' : b)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-[#F2F2F7] text-[#1D1D1F] hover:bg-[#E5E5EA]'
                }`}
              >
                <span>{b}</span>
                <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Directory Table / Cards (Apple Bento Table Style) */}
      <div className="bg-white rounded-3xl border border-[#E5E5EA] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F9F9FB] border-b border-[#E5E5EA] text-[#86868B] font-semibold">
                <th className="p-4 w-10">
                  <button onClick={toggleSelectAll} className="flex items-center text-[#86868B] hover:text-[#1D1D1F]">
                    {selectedIds.length === filteredTeachers.length && filteredTeachers.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-rose-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">Öğretmen Adı Soyadı</th>
                <th className="p-4">Branş</th>
                <th className="p-4">E-posta Adresi (Gmail)</th>
                <th className="p-4">Program Eşleşmesi</th>
                <th className="p-4">Gönderim Durumu</th>
                <th className="p-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA]">
              {filteredTeachers.map((teacher) => {
                const isSelected = selectedIds.includes(teacher.id);
                return (
                  <tr
                    key={teacher.id}
                    className={`hover:bg-[#F9F9FB] transition-colors ${
                      isSelected ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-4">
                      <button
                        onClick={() => toggleSelectOne(teacher.id)}
                        className="flex items-center text-[#86868B] hover:text-[#1D1D1F]"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-rose-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Teacher Name & Initial */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F2F2F7] font-bold text-xs flex items-center justify-center text-[#1D1D1F] border border-[#E5E5EA]">
                          {teacher.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#1D1D1F]">
                            {teacher.fullName}
                          </div>
                          {teacher.phone && (
                            <div className="text-[11px] text-[#86868B]">
                              {teacher.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Branch */}
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-[#F2F2F7] text-[11px] font-medium text-[#48484A]">
                        {teacher.branch}
                      </span>
                    </td>

                    {/* Email */}
                    <td className="p-4 font-mono text-[11px] text-[#1D1D1F]">
                      {teacher.email}
                    </td>

                    {/* Matched Page */}
                    <td className="p-4">
                      {teacher.matchedPageNumber ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Sayfa #{teacher.matchedPageNumber}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3" />
                          Eşleşmedi
                        </span>
                      )}
                    </td>

                    {/* Send Status */}
                    <td className="p-4">
                      {teacher.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                          <Send className="w-3 h-3" />
                          Gönderildi {teacher.lastSentAt ? `(${teacher.lastSentAt})` : ''}
                        </span>
                      ) : teacher.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                          Hata Oluştu
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#86868B]">
                          Bekliyor
                        </span>
                      )}
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onEditTeacher(teacher)}
                          className="p-1.5 text-[#86868B] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTeacherToDelete(teacher)}
                          className="p-1.5 text-[#86868B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredTeachers.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <Users className="w-8 h-8 mx-auto text-[#86868B]" />
              <p className="text-sm font-semibold text-[#1D1D1F]">
                Aranan kriterlere uygun öğretmen bulunamadı.
              </p>
              <p className="text-xs text-[#86868B]">
                Arama filtrenizi temizleyebilir veya yeni öğretmen ekleyebilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-[#1D1D1F] mb-2">Öğretmeni Sil</h3>
            <p className="text-sm text-[#48484A] mb-6">
              <span className="font-semibold text-[#1D1D1F]">{teacherToDelete.fullName}</span> isimli öğretmeni silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setTeacherToDelete(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-xl transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  onDeleteTeacher(teacherToDelete.id);
                  setTeacherToDelete(null);
                }}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-[#1D1D1F] mb-2">Seçili Öğretmenleri Sil</h3>
            <p className="text-sm text-[#48484A] mb-6">
              Seçilen <span className="font-semibold text-rose-600">{selectedIds.length}</span> öğretmeni silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="flex-1 py-2.5 text-sm font-semibold text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-xl transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  selectedIds.forEach((id) => onDeleteTeacher(id));
                  setSelectedIds([]);
                  setIsBulkDeleteModalOpen(false);
                }}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
              >
                Evet, Hepsini Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
