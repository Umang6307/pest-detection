import React, { useState } from 'react';
import { UserProfile } from '../types/pest';
import {
  Bug,
  Database,
  MapPin,
  Activity,
  Layers,
  ChevronDown,
  UserCheck,
  Plus,
  RefreshCw,
  Terminal,
  Cpu,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'detector' | 'map' | 'logs' | 'decisions' | 'sql';
  setActiveTab: (tab: 'detector' | 'map' | 'logs' | 'decisions' | 'sql') => void;
  currentUser: UserProfile | null;
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onOpenNewUserModal: () => void;
  systemStatus: any;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  users,
  onSelectUser,
  onOpenNewUserModal,
  systemStatus,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-950/50 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Bug className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">AgriVision<span className="text-emerald-400">AI</span></span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase tracking-wider">
                  Vision + SQL
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Computer Vision Pest Detection & Regional Infestation Intelligence</p>
            </div>
          </div>

          {/* System Telemetry Badges */}
          <div className="hidden lg:flex items-center space-x-2.5 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-slate-300">AI Vision Engine: <span className="text-emerald-400 font-medium">Gemini 3.8</span></span>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono text-slate-300">SQL DB: <span className="text-blue-400 font-medium">{systemStatus?.database?.split(' ')[0] || 'SQLite'}</span></span>
            </div>
          </div>

          {/* User Profile Selector (Scout / Agronomist Records) */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition text-left"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser?.name}
                className="w-7 h-7 rounded-full object-cover border border-emerald-500/40"
              />
              <div className="text-xs">
                <div className="font-medium text-slate-200 leading-tight flex items-center gap-1">
                  {currentUser?.name || 'Active Scout'}
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
                <div className="text-[10px] text-emerald-400/90 leading-tight">
                  {currentUser?.role || 'Agronomist'}
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2">
                <div className="px-2 py-1.5 border-b border-slate-800 mb-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Assigned Scout / Agronomist
                  </div>
                  <div className="text-xs text-slate-300">Logged actions & impact records sync to this profile</div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSelectUser(u);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full flex items-center space-x-2.5 p-2 rounded-lg text-left text-xs transition ${
                        currentUser?.id === u.id
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{u.role}</div>
                        <div className="text-[10px] text-slate-500 truncate">{u.farm_name} • {u.region}</div>
                      </div>
                      {currentUser?.id === u.id && <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenNewUserModal();
                    }}
                    className="w-full flex items-center justify-center space-x-1.5 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register New Field Scout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('detector')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
              activeTab === 'detector'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-4 h-4 text-emerald-300" />
            <span>AI Pest Detector & Vision</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
              activeTab === 'map'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-300" />
            <span>Regional Infestation Map</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-300" />
            <span>SQL Analysis Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('decisions')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
              activeTab === 'decisions'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-300" />
            <span>Decisions & Impact History</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
              activeTab === 'sql'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-300" />
            <span>SQL Terminal & Flask API</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
