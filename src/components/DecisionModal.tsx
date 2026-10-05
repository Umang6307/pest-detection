import React, { useState } from 'react';
import { PestLog, UserProfile } from '../types/pest';
import { createDecision } from '../services/api';
import { Activity, DollarSign, ShieldAlert, CheckCircle2, X } from 'lucide-react';

interface DecisionModalProps {
  log: PestLog | null;
  currentUser: UserProfile | null;
  onClose: () => void;
  onSuccess: (decision: any) => void;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({
  log,
  currentUser,
  onClose,
  onSuccess,
}) => {
  if (!log) return null;

  const [actionType, setActionType] = useState<string>('Biological Control');
  const [treatmentName, setTreatmentName] = useState<string>(
    log.ipm_recommendations?.biological?.split('.')[0] || 'Trichogramma Parasitoid Release'
  );
  const [dosage, setDosage] = useState<string>('100,000 parasitoids/ha');
  const [costUsd, setCostUsd] = useState<number>(280);
  const [rationale, setRationale] = useState<string>(
    `Targeting ${log.pest_name} larvae on ${log.crop_type} before economic injury threshold surpasses 20%. Recommended by AI IPM vision model.`
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill treatment when action type changes
  const handleActionTypeChange = (type: string) => {
    setActionType(type);
    if (type === 'Biological Control') {
      setTreatmentName(log.ipm_recommendations?.biological?.split('.')[0] || 'Bacillus thuringiensis (Bt) kurstaki');
      setDosage('1.5 kg/ha spray');
      setCostUsd(220);
    } else if (type === 'Precision Targeted Chemical') {
      setTreatmentName(log.ipm_recommendations?.chemical?.split('.')[0] || 'Chlorantraniliprole (Coragen)');
      setDosage('150 ml/ha spot application');
      setCostUsd(380);
    } else if (type === 'Organic Botanical Spray') {
      setTreatmentName('Cold-Pressed Horticultural Neem Oil + Potassium Salt');
      setDosage('5L / 1000L water');
      setCostUsd(160);
    } else if (type === 'Pheromone Trap') {
      setTreatmentName('Delta Pheromone Trapping Network');
      setDosage('12 traps/ha');
      setCostUsd(95);
    } else {
      setTreatmentName('Crop Sanitation & Border Trap Crop Barrier');
      setDosage('Quarter-acre border strip');
      setCostUsd(120);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const decision = await createDecision({
        log_id: log.id,
        user_id: currentUser?.id || 'usr-1',
        action_type: actionType,
        treatment_name: treatmentName,
        dosage,
        cost_usd: costUsd,
        decision_rationale: rationale,
        applied_date: new Date().toISOString(),
      });

      onSuccess(decision);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record decision');
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
                <Activity className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Log Agricultural Decision & Intervention
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Links prescribed treatment, dosage, and cost to log{' '}
              <code className="text-emerald-400 font-mono">{log.id}</code> in the SQL database.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 text-base leading-none">
            ✕
          </button>
        </div>

        {/* Specimen context summary */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
          <div>
            <span className="text-slate-400">Specimen:</span>{' '}
            <strong className="text-white">{log.pest_name}</strong> ({log.crop_type})
          </div>
          <div>
            <span className="text-slate-400">Sector:</span>{' '}
            <strong className="text-slate-200">{log.field_sector}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Intervention Action Type
            </label>
            <select
              value={actionType}
              onChange={(e) => handleActionTypeChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="Biological Control">Biological Control (Biocontrol Parasitoids / Bt)</option>
              <option value="Precision Targeted Chemical">Precision Targeted Chemical (Drone / Spot Spray)</option>
              <option value="Organic Botanical Spray">Organic Botanical Spray (Neem / Fatty Acids)</option>
              <option value="Pheromone Trap">Pheromone Trapping / Mating Disruption</option>
              <option value="Crop Rotation / Sanitation">Crop Rotation / Agroecological Sanitation</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Prescribed Treatment Product
            </label>
            <input
              type="text"
              required
              value={treatmentName}
              onChange={(e) => setTreatmentName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Dosage & Application Rate
              </label>
              <input
                type="text"
                required
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 150 ml/ha"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Estimated Cost (USD)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={costUsd}
                onChange={(e) => setCostUsd(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Decision Rationale & Economic Justification
            </label>
            <textarea
              rows={3}
              required
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
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
              {submitting ? 'Persisting to SQL...' : 'Record Decision in SQL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
