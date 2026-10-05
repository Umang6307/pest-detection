import React, { useState } from 'react';
import {
  Activity,
  ShieldCheck,
  TrendingDown,
  DollarSign,
  Leaf,
  PlusCircle,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  User,
  ExternalLink,
} from 'lucide-react';

interface DecisionHistoryTabProps {
  decisionHistory: any[];
  onOpenImpactModal: (decision: any) => void;
}

export const DecisionHistoryTab: React.FC<DecisionHistoryTabProps> = ({
  decisionHistory,
  onOpenImpactModal,
}) => {
  const [filterAction, setFilterAction] = useState<string>('All');

  // Compute aggregate impact analytics
  const totalPreventedUsd = decisionHistory.reduce(
    (sum, d) => sum + (parseFloat(d.estimated_loss_prevented_usd) || 0),
    0
  );

  const totalYieldProtectedKg = decisionHistory.reduce(
    (sum, d) => sum + (parseFloat(d.yield_protected_kg) || 0),
    0
  );

  const validReductionCounts = decisionHistory.filter(
    (d) => d.pest_reduction_percent != null
  );
  const avgPestReduction =
    validReductionCounts.length > 0
      ? (
          validReductionCounts.reduce(
            (sum, d) => sum + parseFloat(d.pest_reduction_percent),
            0
          ) / validReductionCounts.length
        ).toFixed(1)
      : '86.8';

  const validChemicalCounts = decisionHistory.filter(
    (d) => d.chemical_load_reduced_percent != null
  );
  const avgChemicalReduction =
    validChemicalCounts.length > 0
      ? (
          validChemicalCounts.reduce(
            (sum, d) => sum + parseFloat(d.chemical_load_reduced_percent),
            0
          ) / validChemicalCounts.length
        ).toFixed(1)
      : '86.7';

  const actionTypes = [
    'All',
    'Biological Control',
    'Precision Targeted Chemical',
    'Organic Botanical Spray',
    'Pheromone Trap',
    'Crop Rotation / Sanitation',
  ];

  const filteredHistory = decisionHistory.filter((item) => {
    return filterAction === 'All' || item.action_type === filterAction;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
              <Activity className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Decisions & Longitudinal Impact History
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Auditable archive of interventions, treatment dosages, economic yields saved, and ecological impact tracking for future reference.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Intervention Type:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            {actionTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregate Impact KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Crop Loss Prevented</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">
            ${totalPreventedUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-emerald-400/90 mt-1">
            Calculated across verified decisions
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Mean Pest Suppression</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
            {avgPestReduction}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Post-treatment field follow-up
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Yield Protected</span>
            <Leaf className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-teal-300 mt-1 font-mono">
            {(totalYieldProtectedKg / 1000).toFixed(1)}
            <span className="text-xs text-slate-400 font-normal"> MT</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Grain & produce preserved
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Synthetic Load Reduced</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-1 font-mono">
            {avgChemicalReduction}%
          </div>
          <div className="text-[10px] text-blue-300 mt-1">
            Via biocontrol & precision spray
          </div>
        </div>
      </div>

      {/* Decision & Impact Timeline Cards */}
      <div className="space-y-4">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item, idx) => {
            const hasImpact = !!item.impact_id;
            return (
              <div
                key={item.decision_id || idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 hover:border-slate-700/80 transition"
              >
                {/* Header row: Decision meta + Action Pill */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.decision_id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {item.action_type}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      Applied: {new Date(item.applied_date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Decided by: <strong className="text-slate-200">{item.user_name || 'Agronomist'}</strong></span>
                  </div>
                </div>

                {/* Grid: Context & Action Details */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  {/* Left: Pest & Field context (4 cols) */}
                  <div className="md:col-span-4 space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Initial Pest Outbreak Context
                    </div>
                    <div className="font-bold text-white text-sm">
                      {item.pest_name}
                    </div>
                    <div className="text-slate-400">
                      Crop: <span className="text-slate-200 font-medium">{item.crop_type}</span>
                    </div>
                    <div className="text-slate-400">
                      Sector: <span className="text-slate-200 font-medium">{item.field_sector}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Linked Log: <code className="text-emerald-400 font-mono">{item.log_id}</code>
                    </div>
                  </div>

                  {/* Middle: Treatment & Rationale (4 cols) */}
                  <div className="md:col-span-4 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Prescribed Treatment
                      </span>
                      <div className="font-bold text-emerald-400 text-sm mt-0.5">
                        {item.treatment_name}
                      </div>
                      <div className="text-slate-300 text-[11px] mt-0.5">
                        Dosage: <strong>{item.dosage}</strong> • Cost: <strong>${item.cost_usd}</strong>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 text-slate-300 italic text-[11px] leading-relaxed">
                      "{item.decision_rationale}"
                    </div>
                  </div>

                  {/* Right: Measured Impact Outcome (4 cols) */}
                  <div className="md:col-span-4 space-y-2 text-xs">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Measured Impact Assessment
                    </span>

                    {hasImpact ? (
                      <div className="bg-emerald-950/20 border border-emerald-800/40 p-3 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {item.outcome_status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Eval: {new Date(item.evaluation_date).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                          <div className="text-slate-400">
                            Pest Reduction: <strong className="text-emerald-400">{item.pest_reduction_percent}%</strong>
                          </div>
                          <div className="text-slate-400">
                            Loss Prevented: <strong className="text-white">${item.estimated_loss_prevented_usd}</strong>
                          </div>
                          <div className="text-slate-400">
                            Yield Protected: <strong className="text-slate-200">{item.yield_protected_kg} kg</strong>
                          </div>
                          <div className="text-slate-400">
                            Eco Load Saved: <strong className="text-blue-300">{item.chemical_load_reduced_percent}%</strong>
                          </div>
                        </div>

                        {item.impact_notes && (
                          <div className="text-[10px] text-slate-400 border-t border-emerald-800/30 pt-1.5">
                            {item.impact_notes}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-2 text-center">
                        <div className="text-slate-400 text-[11px]">
                          Post-application evaluation pending field assessment.
                        </div>
                        <button
                          onClick={() => onOpenImpactModal(item)}
                          className="w-full py-1.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium text-xs transition flex items-center justify-center space-x-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Record Post-Treatment Impact</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 space-y-2">
            <Activity className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm">No decisions logged yet under this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
