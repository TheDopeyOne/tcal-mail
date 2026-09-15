import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Download, 
  Trash2, 
  Search, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { MailLog } from '../types';
import { exportToExcel } from '../utils/excelParser';

interface QueueLogsViewProps {
  logs: MailLog[];
  isSending: boolean;
  onClearLogs: () => void;
  onRetryFailed: () => void;
}

export const QueueLogsView: React.FC<QueueLogsViewProps> = ({
  logs,
  isSending,
  onClearLogs,
  onRetryFailed,
}) => {
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [search, setSearch] = useState('');

  const successCount = logs.filter((l) => l.status === 'success').length;
  const failedCount = logs.filter((l) => l.status === 'failed').length;
  const pendingCount = logs.filter((l) => l.status === 'pending' || l.status === 'sending').length;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = `${log.teacherName} ${log.email} ${log.messageSubject}`
      .toLowerCase()
      .includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'success') return log.status === 'success';
    if (filter === 'failed') return log.status === 'failed';
    return true;
  });

  const handleExportLogs = () => {
    const data = logs.map((l) => ({
      'Tarih / Zaman': l.timestamp,
      'Öğretmen Adı': l.teacherName,
      'E-posta': l.email,
      'Sayfa No': l.pageNumber ? `Sayfa ${l.pageNumber}` : '-',
      'Durum': l.status === 'success' ? 'Başarılı' : l.status === 'failed' ? 'Hata' : 'Kuyrukta',
      'Konu': l.messageSubject,
      'Hata Detayı': l.errorMessage || '-',
      'Süre (ms)': l.deliveryDurationMs || 0,
    }));
    exportToExcel(data, 'TOKI_CAL_Gonderim_Raporu');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Overview Bar */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
            Gönderim Kuyruğu & Canlı Denetim Kayıtları
          </h2>
          <p className="text-xs sm:text-sm text-[#86868B] mt-1">
            Gmail SMTP sunucusu üzerinden gerçekleştirilen tüm tekli ve toplu e-posta gönderimlerinin anlık günlüğü.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {failedCount > 0 && (
            <button
              onClick={onRetryFailed}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Hatalıları Tekrar Dene ({failedCount})</span>
            </button>
          )}

          <button
            onClick={handleExportLogs}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] disabled:opacity-40 rounded-xl border border-[#D1D1D6] transition-all"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Raporu İndir (.xlsx)</span>
          </button>

          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="p-2 text-[#86868B] hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40 rounded-xl transition-colors"
            title="Logları Temizle"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bento Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-[#86868B]">Başarılı Teslimat</span>
            <div className="text-2xl font-black text-emerald-600">{successCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-[#86868B]">Hata / İletilemedi</span>
            <div className="text-2xl font-black text-rose-600">{failedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-[#86868B]">Kuyrukta Bekleyen</span>
            <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
          <input
            type="text"
            placeholder="Öğretmen veya e-posta ile log ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white border border-[#E5E5EA] focus:border-rose-500 outline-none"
          />
        </div>

        <div className="inline-flex p-1 bg-[#F2F2F7] rounded-xl border border-[#E5E5EA] text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'all' ? 'bg-white text-[#1D1D1F] font-bold shadow-xs' : 'text-[#86868B]'
            }`}
          >
            Tüm Loglar ({logs.length})
          </button>
          <button
            onClick={() => setFilter('success')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'success' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-[#86868B]'
            }`}
          >
            Başarılı ({successCount})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'failed' ? 'bg-white text-rose-700 font-bold shadow-xs' : 'text-[#86868B]'
            }`}
          >
            Hatalı ({failedCount})
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-[#E5E5EA] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F9F9FB] border-b border-[#E5E5EA] text-[#86868B] font-semibold">
                <th className="p-3.5">Zaman Damgası</th>
                <th className="p-3.5">Öğretmen</th>
                <th className="p-3.5">Hedef E-posta</th>
                <th className="p-3.5">Eklenen Sayfa</th>
                <th className="p-3.5">Durum</th>
                <th className="p-3.5">Gecikme / Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F9F9FB] transition-colors">
                  <td className="p-3.5 font-mono text-[11px] text-[#86868B]">
                    {log.timestamp}
                  </td>
                  <td className="p-3.5 font-bold text-[#1D1D1F]">
                    {log.teacherName}
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-[#48484A]">
                    {log.email}
                  </td>
                  <td className="p-3.5">
                    {log.pageNumber ? (
                      <span className="px-2 py-0.5 rounded-md bg-[#F2F2F7] font-mono text-[11px] font-semibold text-[#1D1D1F]">
                        Sayfa #{log.pageNumber}
                      </span>
                    ) : (
                      <span className="text-[#86868B]">-</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    {log.status === 'success' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" />
                        İletildi
                      </span>
                    )}
                    {log.status === 'failed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3" />
                        Hata
                      </span>
                    )}
                    {log.status === 'sending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Gönderiliyor...
                      </span>
                    )}
                    {log.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        Bekliyor
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-[11px]">
                    {log.status === 'success' ? (
                      <span className="text-emerald-700 font-medium">
                        {log.deliveryDurationMs ? `${log.deliveryDurationMs} ms içinde teslim edildi` : 'Teslim edildi'}
                      </span>
                    ) : log.errorMessage ? (
                      <span className="text-rose-600 font-mono text-[10px]">
                        {log.errorMessage}
                      </span>
                    ) : (
                      <span className="text-[#86868B]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="py-12 text-center text-xs text-[#86868B]">
              Henüz kayıtlı log bulunmuyor. Toplu gönderim başlattığınızda burada canlı olarak akacaktır.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
