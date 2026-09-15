import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Pause,
  Play,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Minimize2,
  Maximize2,
  Mail,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  FileCheck,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Teacher, SchedulePage, SmtpSettings, ActiveTab } from '../types';

export interface BulkSendStatus {
  isSending: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  current: number;
  total: number;
  currentTeacher: Teacher | null;
  currentPageNumber: number | null;
  currentStepDescription: string;
  delayRemainingSeconds: number;
  recentDeliveries: Array<{
    id: string;
    teacherName: string;
    email: string;
    pageNumber: number;
    durationMs: number;
    timestamp: string;
    status: 'success' | 'failed';
  }>;
}

interface AnimatedBulkSenderProps {
  status: BulkSendStatus;
  smtpSettings: SmtpSettings;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onReset: () => void;
  onNavigateToQueue: () => void;
}

export const AnimatedBulkSender: React.FC<AnimatedBulkSenderProps> = ({
  status,
  smtpSettings,
  onPause,
  onResume,
  onCancel,
  onReset,
  onNavigateToQueue,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const {
    isSending,
    isPaused,
    isCompleted,
    current,
    total,
    currentTeacher,
    currentPageNumber,
    currentStepDescription,
    delayRemainingSeconds,
    recentDeliveries,
  } = status;

  // Calculate percentage
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  // Trigger celebratory confetti when completed
  React.useEffect(() => {
    if (isCompleted && total > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.8, x: 0.8 },
          colors: ['#E11D48', '#2563EB', '#10B981', '#F59E0B'],
        });
      } catch (e) {
        // ignore if confetti not supported
      }
    }
  }, [isCompleted, total]);

  // Don't show if idle and not completed
  if (!isSending && !isPaused && !isCompleted && current === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full px-4 sm:px-0">
      <AnimatePresence mode="wait">
        {isMinimized ? (
          /* Minimized Floating Pill Mode */
          <motion.div
            key="minimized"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="cursor-pointer bg-[#1C1C1E] text-white p-3.5 rounded-full shadow-2xl border border-white/15 flex items-center gap-3 backdrop-blur-xl hover:scale-105 transition-transform"
            onClick={() => setIsMinimized(false)}
          >
            {/* Pulsing indicator */}
            <div className="relative flex items-center justify-center w-8 h-8">
              {isSending && !isPaused ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <div className="relative w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white">
                    <Send className="w-4 h-4 animate-bounce" />
                  </div>
                </>
              ) : isCompleted ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <Check className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
                  <Pause className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Quick status text */}
            <div className="text-xs font-semibold pr-2">
              {isCompleted ? (
                <span className="text-emerald-400">Toplu Gönderim Tamamlandı! ({total}/{total})</span>
              ) : isPaused ? (
                <span className="text-amber-300">Duraklatıldı (%{percentage})</span>
              ) : (
                <span className="text-white">
                  Arka Planda İletiliyor: %{percentage} ({current}/{total})
                </span>
              )}
            </div>

            {/* Expand icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(false);
              }}
              className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
              title="Genişlet"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ) : (
          /* Full Rich Bento Deck */
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="rounded-3xl bg-linear-to-b from-[#1C1C1E] to-[#121214] text-white p-6 shadow-2xl border border-white/15 backdrop-blur-2xl space-y-5 overflow-hidden relative"
          >
            {/* Background Ambient Glow */}
            <div
              className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 transition-colors duration-700 ${
                isCompleted ? 'bg-emerald-500' : isSending ? 'bg-rose-500' : 'bg-amber-500'
              }`}
            />

            {/* Header: Title & Window Controls */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center w-8 h-8">
                  {isSending && !isPaused ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                      <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
                        <Send className="w-4 h-4" />
                      </div>
                    </>
                  ) : isCompleted ? (
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-600/30">
                      <Pause className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <span>Toplu Arka Plan Gönderimi</span>
                    {smtpSettings.simulationMode && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/10 text-zinc-300">
                        Simülasyon
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {isCompleted
                      ? 'Tüm Programlar İletildi!'
                      : isPaused
                      ? 'Gönderim Duraklatıldı'
                      : 'Öğretmenlere İletiliyor...'}
                  </h4>
                </div>
              </div>

              {/* Action Min/Close */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Simge Durumuna Küçült"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                {isCompleted && (
                  <button
                    onClick={onReset}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Kapat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Circular & Linear Progress Combined Section */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* SVG Circular Progress Ring */}
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth="4"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="24"
                        cy="24"
                        r="18"
                        stroke={isCompleted ? '#10B981' : '#F43F5E'}
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={113}
                        animate={{ strokeDashoffset: 113 - (113 * percentage) / 100 }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-black font-mono text-white">
                      %{percentage}
                    </span>
                  </div>

                  <div>
                    <div className="text-base font-black text-white font-mono tracking-tight">
                      {current} <span className="text-zinc-500 text-xs font-normal">/ {total} Öğretmen</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {isCompleted
                        ? '16 Öğretmenin tamamına ulaştı'
                        : `Kalan: ${Math.max(0, total - current)} Öğretmen`}
                    </div>
                  </div>
                </div>

                {/* Delay / Rate Limit Badge */}
                {isSending && !isPaused && delayRemainingSeconds > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-medium">
                    <Clock className="w-3 h-3 animate-spin" />
                    <span>Kota: {delayRemainingSeconds.toFixed(1)}s</span>
                  </div>
                )}
              </div>

              {/* Linear Gradient Progress Bar with Glow */}
              <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden p-0.5 relative">
                <motion.div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-linear-to-r from-emerald-500 to-teal-400'
                      : 'bg-linear-to-r from-rose-600 via-orange-500 to-emerald-400 shadow-sm'
                  }`}
                  animate={{ width: `${percentage}%` }}
                />
              </div>

              {/* Active Teacher Dispatch Details */}
              {currentTeacher && !isCompleted && (
                <div className="pt-1 flex items-center justify-between text-[11px] border-t border-white/10">
                  <div className="truncate max-w-[240px]">
                    <span className="text-zinc-400">İletilen: </span>
                    <span className="font-bold text-white">Sayın {currentTeacher.fullName}</span>
                  </div>
                  <div className="text-zinc-400 font-mono text-[10px] shrink-0">
                    {currentPageNumber ? `Sayfa #${currentPageNumber}` : ''}
                  </div>
                </div>
              )}
            </div>

            {/* Current Step / Description Box */}
            <div className="text-xs text-zinc-300 bg-black/40 rounded-xl px-3.5 py-2.5 border border-white/5 flex items-start gap-2 relative z-10">
              <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-snug">
                {currentStepDescription || 'Arka plan SMTP işleyicisi çalışıyor...'}
              </div>
            </div>

            {/* Recent Deliveries Stream */}
            {recentDeliveries.length > 0 && (
              <div className="space-y-1.5 relative z-10">
                <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                  Son İletilenler (Canlı Akış)
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {recentDeliveries.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-[11px] bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="font-medium text-white truncate">
                          Sayın {item.teacherName}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono truncate">
                          ({item.email})
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono shrink-0 pl-1">
                        {item.durationMs}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Control Buttons */}
            <div className="flex items-center gap-2 pt-1 relative z-10">
              {isCompleted ? (
                <>
                  <button
                    onClick={onNavigateToQueue}
                    className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-white/15 hover:bg-white/20 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    Gönderim Raporunu Gör
                  </button>
                  <button
                    onClick={onReset}
                    className="py-2.5 px-4 text-xs font-bold text-black bg-white hover:bg-zinc-200 rounded-xl transition-all"
                  >
                    Kapat
                  </button>
                </>
              ) : (
                <>
                  {isSending && !isPaused ? (
                    <button
                      onClick={onPause}
                      className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/20 active:scale-95"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Gönderimi Duraklat
                    </button>
                  ) : (
                    <button
                      onClick={onResume}
                      className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Kaldığı Yerden Devam Et
                    </button>
                  )}

                  <button
                    onClick={onCancel}
                    className="py-2.5 px-3.5 text-xs font-semibold text-zinc-400 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl transition-all active:scale-95"
                  >
                    İptal
                  </button>

                  <button
                    onClick={onNavigateToQueue}
                    className="p-2.5 text-zinc-400 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl transition-all"
                    title="Kuyruk Detayları"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
