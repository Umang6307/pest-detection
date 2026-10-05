import React, { useState } from 'react';
import { createUser } from '../services/api';
import { UserCheck, UserPlus, X } from 'lucide-react';
import { UserProfile } from '../types/pest';

interface NewUserModalProps {
  onClose: () => void;
  onUserCreated: (user: UserProfile) => void;
}

export const NewUserModal: React.FC<NewUserModalProps> = ({
  onClose,
  onUserCreated,
}) => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<string>('Senior Field Scout');
  const [farmName, setFarmName] = useState<string>('Central Plains Co-op');
  const [region, setRegion] = useState<string>('Midwest Corn Belt (Iowa)');
  const [avatar, setAvatar] = useState<string>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Name and email are required');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const user = await createUser({
        name,
        email,
        role,
        farm_name: farmName,
        region,
        avatar,
      });
      onUserCreated(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create user profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
              <UserPlus className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Register New Field Scout / Agronomist
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 text-base leading-none">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Jordan Hayes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. jordan.hayes@agrivision.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Professional Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="Lead Agronomist & Pathologist">Lead Agronomist & Pathologist</option>
              <option value="Senior Field Scout">Senior Field Scout</option>
              <option value="Farm Operations Director">Farm Operations Director</option>
              <option value="IPM Extension Specialist">IPM Extension Specialist</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Farm / Organization
              </label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Agronomic Region
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
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
              {submitting ? 'Creating User...' : 'Save to SQL Users'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
