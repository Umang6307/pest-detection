import React, { useState, useEffect } from 'react';
import {
  fetchSystemStatus,
  fetchUsers,
  fetchPestLogs,
  fetchDecisionHistory,
  fetchRegionalTrends,
} from './services/api';
import { PestLog, RegionalTrend, UserProfile } from './types/pest';
import { Header } from './components/Header';
import { DetectorTab } from './components/DetectorTab';
import { RegionalMapTab } from './components/RegionalMapTab';
import { LogsTab } from './components/LogsTab';
import { DecisionHistoryTab } from './components/DecisionHistoryTab';
import { SqlExplorerTab } from './components/SqlExplorerTab';
import { DecisionModal } from './components/DecisionModal';
import { ImpactModal } from './components/ImpactModal';
import { NewUserModal } from './components/NewUserModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'detector' | 'map' | 'logs' | 'decisions' | 'sql'>('detector');
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [logs, setLogs] = useState<PestLog[]>([]);
  const [decisionHistory, setDecisionHistory] = useState<any[]>([]);
  const [regionalTrends, setRegionalTrends] = useState<RegionalTrend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Cross-tab selected specimen
  const [selectedLogForView, setSelectedLogForView] = useState<PestLog | null>(null);

  // Modals state
  const [modalLogForDecision, setModalLogForDecision] = useState<PestLog | null>(null);
  const [modalDecisionForImpact, setModalDecisionForImpact] = useState<any | null>(null);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState<boolean>(false);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [status, usersData, logsData, historyData, trendsData] = await Promise.all([
        fetchSystemStatus().catch(() => null),
        fetchUsers().catch(() => []),
        fetchPestLogs().catch(() => []),
        fetchDecisionHistory().catch(() => []),
        fetchRegionalTrends().catch(() => []),
      ]);

      setSystemStatus(status);
      setUsers(usersData);
      if (usersData.length > 0 && !currentUser) {
        setCurrentUser(usersData[0]);
      }
      setLogs(logsData);
      setDecisionHistory(historyData);
      setRegionalTrends(trendsData);
    } catch (err) {
      console.error('Failed to initialize app data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Callback when a new detection finishes
  const handleDetectionComplete = (newLog: PestLog) => {
    setLogs((prev) => [newLog, ...prev]);
    // Refresh status stats
    fetchSystemStatus().then(setSystemStatus).catch(() => {});
  };

  // Callback when a new decision is logged
  const handleDecisionRecorded = () => {
    // Reload logs and history
    fetchPestLogs().then(setLogs).catch(() => {});
    fetchDecisionHistory().then(setDecisionHistory).catch(() => {});
    fetchSystemStatus().then(setSystemStatus).catch(() => {});
  };

  // Callback when an impact is recorded
  const handleImpactRecorded = () => {
    fetchPestLogs().then(setLogs).catch(() => {});
    fetchDecisionHistory().then(setDecisionHistory).catch(() => {});
  };

  const handleOpenDecisionModal = (log: PestLog) => {
    setModalLogForDecision(log);
  };

  const handleOpenImpactModal = (decision: any) => {
    setModalDecisionForImpact(decision);
  };

  const handleSelectLogForView = (log: PestLog) => {
    setSelectedLogForView(log);
    setActiveTab('detector');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Global Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        users={users}
        onSelectUser={setCurrentUser}
        onOpenNewUserModal={() => setIsNewUserModalOpen(true)}
        systemStatus={systemStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            <p className="text-xs text-slate-400 font-mono tracking-wider">
              Initializing SQL Database & Computer Vision Models...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'detector' && (
              <DetectorTab
                currentUser={currentUser}
                onDetectionComplete={handleDetectionComplete}
                onOpenDecisionModal={handleOpenDecisionModal}
                selectedLogForView={selectedLogForView}
              />
            )}

            {activeTab === 'map' && (
              <RegionalMapTab trends={regionalTrends} />
            )}

            {activeTab === 'logs' && (
              <LogsTab
                logs={logs}
                onSelectLogForView={handleSelectLogForView}
                onOpenDecisionModal={handleOpenDecisionModal}
              />
            )}

            {activeTab === 'decisions' && (
              <DecisionHistoryTab
                decisionHistory={decisionHistory}
                onOpenImpactModal={handleOpenImpactModal}
              />
            )}

            {activeTab === 'sql' && <SqlExplorerTab />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            AgriVision AI • Fullstack Computer Vision & Regional Pest Intelligence Platform
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-mono">
            <span>Model: Gemini 3.8 Flash Multimodal</span>
            <span>•</span>
            <span>Storage: SQLite / SQL Relational Engine</span>
            <span>•</span>
            <span>API: Flask & Express Compatible</span>
          </div>
        </div>
      </footer>

      {/* Decision Modal */}
      {modalLogForDecision && (
        <DecisionModal
          log={modalLogForDecision}
          currentUser={currentUser}
          onClose={() => setModalLogForDecision(null)}
          onSuccess={handleDecisionRecorded}
        />
      )}

      {/* Impact Modal */}
      {modalDecisionForImpact && (
        <ImpactModal
          decision={modalDecisionForImpact}
          onClose={() => setModalDecisionForImpact(null)}
          onSuccess={handleImpactRecorded}
        />
      )}

      {/* New User Modal */}
      {isNewUserModalOpen && (
        <NewUserModal
          onClose={() => setIsNewUserModalOpen(false)}
          onUserCreated={(newUser) => {
            setUsers((prev) => [newUser, ...prev]);
            setCurrentUser(newUser);
          }}
        />
      )}
    </div>
  );
}
