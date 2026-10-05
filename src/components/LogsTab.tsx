import React, { useState } from 'react';
import { PestLog } from '../types/pest';
import {
  Database,
  Search,
  Filter,
  Download,
  Eye,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Tag,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface LogsTabProps {
  logs: PestLog[];
  onSelectLogForView: (log: PestLog) => void;
  onOpenDecisionModal: (log: PestLog) => void;
}

export const LogsTab: React.FC<LogsTabProps> = ({
  logs,
  onSelectLogForView,
  onOpenDecisionModal,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCrop, setSelectedCrop] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [inspectedLog, setInspectedLog] = useState<PestLog | null>(null);

  // Crops list for filter
  const crops = ['All', ...Array.from(new Set(logs.map((l) => l.crop_type)))];

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      log.pest_name.toLowerCase().includes(query) ||
      log.scientific_name.toLowerCase().includes(query) ||
      log.crop_type.toLowerCase().includes(query) ||
      log.location_name.toLowerCase().includes(query) ||
      (log.user_name && log.user_name.toLowerCase().includes(query));

    const matchesCrop = selectedCrop === 'All' || log.crop_type === selectedCrop;
    const matchesSeverity =
      selectedSeverity === 'All' || log.severity_level === selectedSeverity;
    const matchesStatus =
      selectedStatus === 'All' || log.status === selectedStatus;

    return matchesSearch && matchesCrop && matchesSeverity && matchesStatus;
  });

  const getSeverityBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'moderate':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'mitigating':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      default:
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
  };

  const exportCsv = () => {
    const headers = [
      'Log ID',
      'Pest Name',
      'Scientific Name',
      'Crop',
      'Severity',
      'Severity Score',
      'Confidence',
      'Location',
      'Sector',
      'Scout Name',
      'Timestamp',
      'Status',
    ];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.pest_name}"`,
      `"${l.scientific_name}"`,
      `"${l.crop_type}"`,
      l.severity_level,
      l.severity_score,
      l.confidence,
      `"${l.location_name}"`,
      `"${l.field_sector}"`,
      `"${l.user_name || 'N/A'}"`,
      l.timestamp,
      l.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agrivision_pest_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
              <Database className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              SQL Analysis Logs & Agronomic Records
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Persisted computer vision logs, bounding coordinates, severity scores, and assigned field scouts.
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export SQL Records (CSV)</span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search pest, crop, scout, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            {crops.map((c) => (
              <option key={c} value={c}>
                Crop: {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Severity Tiers</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Moderate">Moderate</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Mitigating">Mitigating</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Specimen</th>
                <th className="py-3 px-4">Pest & Scientific Name</th>
                <th className="py-3 px-4">Crop</th>
                <th className="py-3 px-4">Severity / Score</th>
                <th className="py-3 px-4">Location / Sector</th>
                <th className="py-3 px-4">Assigned Scout</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => setInspectedLog(log)}
                  >
                    <td className="py-2.5 px-4">
                      <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                        <img
                          src={log.image_url}
                          alt={log.pest_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-white">{log.pest_name}</div>
                      <div className="text-[11px] text-emerald-400/90 italic font-serif">
                        {log.scientific_name}
                      </div>
                    </td>

                    <td className="py-2.5 px-4 font-medium text-slate-200">
                      {log.crop_type}
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getSeverityBadge(
                            log.severity_level
                          )}`}
                        >
                          {log.severity_level}
                        </span>
                        <span className="font-mono text-slate-400">
                          {log.severity_score}/100
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-4 text-slate-400">
                      <div className="text-slate-200 truncate max-w-[140px]">{log.location_name}</div>
                      <div className="text-[10px] text-slate-500">{log.field_sector}</div>
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="flex items-center space-x-2">
                        {log.user_avatar && (
                          <img
                            src={log.user_avatar}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        )}
                        <span className="text-slate-300 truncate max-w-[100px]">
                          {log.user_name || 'Scout'}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${getStatusBadge(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectLogForView(log)}
                          title="Open in Vision Detector Viewport"
                          className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenDecisionModal(log)}
                          title="Record Decision for this Log"
                          className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No matching pest logs found for the applied filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Inspector Modal when row is clicked */}
      {inspectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  SQL Log ID: {inspectedLog.id}
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  {inspectedLog.pest_name}
                </h3>
                <div className="text-xs text-emerald-400 italic">
                  {inspectedLog.scientific_name} ({inspectedLog.crop_type})
                </div>
              </div>
              <button
                onClick={() => setInspectedLog(null)}
                className="text-slate-400 hover:text-white p-1 text-base leading-none"
              >
                ✕
              </button>
            </div>

            {/* Specimen photo with bounding boxes preview */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <img
                src={inspectedLog.image_url}
                alt={inspectedLog.pest_name}
                className="w-full h-full object-cover"
              />
              {inspectedLog.bounding_boxes?.map((box, idx) => (
                <div
                  key={idx}
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`,
                  }}
                  className="absolute border-2 border-emerald-400 bg-emerald-500/20"
                >
                  <span className="absolute -top-5 left-0 px-1 py-0.5 text-[9px] font-mono font-bold bg-slate-950/90 text-emerald-300 rounded">
                    {box.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Symptoms and Details */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Damage Symptoms Identified
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {inspectedLog.symptoms?.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start space-x-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Geo & Scout */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-slate-500 text-[10px] block">Field Sector</span>
                <span className="font-semibold text-white">{inspectedLog.field_sector}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Coordinates</span>
                <span className="font-mono text-slate-300">
                  {inspectedLog.latitude?.toFixed(4)}, {inspectedLog.longitude?.toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Logged At</span>
                <span className="text-slate-300">
                  {new Date(inspectedLog.timestamp).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action buttons inside modal */}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => {
                  onSelectLogForView(inspectedLog);
                  setInspectedLog(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition"
              >
                Inspect in Computer Vision Studio
              </button>
              <button
                onClick={() => {
                  onOpenDecisionModal(inspectedLog);
                  setInspectedLog(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition"
              >
                Record Decision for this Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
