import React from 'react';
import { SchoolLogo } from './SchoolLogo';
import { ActiveTab, SmtpSettings } from '../types';
import { 
  LayoutGrid, 
  FileText, 
  Users, 
  Send, 
  Settings, 
  Compass, 
  ShieldCheck, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  smtpSettings: SmtpSettings;
  matchedCount: number;
  totalTeachers: number;
  onOpenRoadmap: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  smtpSettings,
  matchedCount,
  totalTeachers,
  onOpenRoadmap,
}) => {
  const tabs = [
    { id: 'bento' as ActiveTab, label: 'Dağıtım Masası', icon: LayoutGrid },
    { id: 'schedule' as ActiveTab, label: 'Program PDF', icon: FileText, badge: matchedCount },
    { id: 'teachers' as ActiveTab, label: 'Öğretmen Rehberi', icon: Users, badge: totalTeachers },
    { id: 'queue' as ActiveTab, label: 'Gönderim & Loglar', icon: Send },
    { id: 'settings' as ActiveTab, label: 'Gmail SMTP', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 border-b border-[#E5E5EA] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Branding Tier */}
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & School Name */}
          <div className="flex items-center gap-3.5 min-w-0">
            <SchoolLogo size="lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#1D1D1F] truncate">
                  TOKİ Cumhuriyet Anadolu Lisesi Toplu Mail App V1
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[#86868B] truncate">
                Milli Eğitim Bakanlığı Müfredat & e-Okul Uyumlu Haftalık Program Otomasyonu
              </p>
            </div>
          </div>

          {/* Right Action Widgets */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* 20-Year Senior Roadmap Button */}
            <button
              onClick={onOpenRoadmap}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] active:scale-95 transition-all rounded-full border border-[#D1D1D6]/60 shadow-xs"
              title="20 Yıllık Kıdemli Geliştirici & UI Designer Yol Haritası"
            >
              <Compass className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Kıdemli</span> Yol Haritası
            </button>

            {/* SMTP Status Pill */}
            {smtpSettings.simulationMode ? (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Güvenli Test Modu</span>
              </div>
            ) : smtpSettings.isConfigured ? (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gmail Canlı SMTP</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Apple-Style Segmented Control Navigation Bar */}
        <div className="pb-3 pt-1 overflow-x-auto no-scrollbar">
          <nav className="inline-flex p-1 bg-[#F2F2F7]/90 rounded-2xl border border-[#E5E5EA] shadow-inner gap-1 min-w-full sm:min-w-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#1D1D1F] shadow-sm font-bold scale-[1.02]'
                      : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rose-600' : 'text-[#86868B]'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-[#E5E5EA] text-[#636366]'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
