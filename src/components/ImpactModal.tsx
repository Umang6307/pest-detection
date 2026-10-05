import React, { useState } from 'react';
import { createImpactAssessment } from '../services/api';
import { ShieldCheck, TrendingDown, DollarSign, X } from 'lucide-react';

interface ImpactModalProps {
  decision: any;
  onClose: () => void;
  onSuccess: (impact: any) => void;
}

export const ImpactModal: React.FC<ImpactModalProps> = ({
  decision,
  onClose,
  onSuccess,
}) => {
  if (!decision) return null;

  const [pestReduction, setPestReduction] = useState<number>(88.5);
  const [yieldProtected, setYieldProtected] = useState<number>(3200);
  const [lossPrevented, setLossPrevented] = useState<number>(4500);
  const [chemicalReduced, setChemicalReduced] = useState<number>(90);
  const [pollinatorsPreserved, setPollinatorsPreserved] = useState<boolean>(true);
  const [outcomeStatus, setOutcomeStatus] = useState<string>('Highly Effective');
  const [notes, setNotes] = useState<string>(
    'Field scouting 72 hours post-treatment verified complete cessation of foliage chewing. Predator ladybird counts stable.'
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const impact = await createImpactAssessment({
        decision_id: decision.decision_id || decision.id,
        log_id: decision.log_id,
        pest_reduction_percent: pestReduction,
        yield_protected_kg: yieldProtected,
        estimated_loss_prevented_usd: lossPrevented,
        chemical_load_reduced_percent: chemicalReduced,
        beneficial_insects_preserved: pollinatorsPreserved,
        outcome_status: outcomeStatus,
        notes,
      });

      onSuccess(impact);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record impact assessment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Record Longitudinal Impact Assessment
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Evaluates post-treatment field outcomes, economic loss prevented, and ecological benefits.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 text-base leading-none">
            ✕
          </button>
        </div>

        {/* Treatment context */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
          <div>
            <span className="text-slate-400">Treatment:</span>{' '}
            <strong className="text-emerald-400">{decision.treatment_name}</strong>
          </div>
          <div>
            <span className="text-slate-400">Pest:</span>{' '}
            <strong className="text-white">{decision.pest_name || 'Targeted pest'}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Pest Suppression Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={pestReduction}
                onChange={(e) => setPestReduction(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Crop Loss Prevented ($ USD)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={lossPrevented}
                onChange={(e) => setLossPrevented(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Yield Protected (kg)
              </label>
              <input
                type="number"
                step="10"
                min="0"
                required
                value={yieldProtected}
                onChange={(e) => setYieldProtected(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Chemical Load Reduction (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                required
                value={chemicalReduced}
                onChange={(e) => setChemicalReduced(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Field Outcome Classification
            </label>
            <select
              value={outcomeStatus}
              onChange={(e) => setOutcomeStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="Highly Effective">Highly Effective (&gt;85% suppression)</option>
              <option value="Moderate Control">Moderate Control (60% - 85% suppression)</option>
              <option value="Resistance Observed">Resistance Observed (Sub-threshold control)</option>
              <option value="Re-infestation">Re-infestation / Migratory Inflow</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="pollinators"
              checked={pollinatorsPreserved}
              onChange={(e) => setPollinatorsPreserved(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0 w-4 h-4"
            />
            <label htmlFor="pollinators" className="text-slate-300 font-medium cursor-pointer">
              Beneficial predators & pollinators preserved (Ladybirds, Bees, Lacewings)
            </label>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Follow-Up Field Agronomist Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {error && <div className="text-red-400 text-xs">{error}</div>}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition disabled:opacity-50"
            >
              {submitting ? 'Persisting to SQL...' : 'Record Impact in SQL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
