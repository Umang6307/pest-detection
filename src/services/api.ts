import { PestLog, DecisionRecord, ImpactAssessment, RegionalTrend, UserProfile } from '../types/pest';

export async function fetchSystemStatus() {
  const res = await fetch('/api/system/status');
  if (!res.ok) throw new Error('Failed to fetch system status');
  return res.json();
}

export async function fetchUsers(): Promise<UserProfile[]> {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function createUser(userData: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) throw new Error('Failed to create user');
  return res.json();
}

export async function fetchPestLogs(): Promise<PestLog[]> {
  const res = await fetch('/api/pest/logs');
  if (!res.ok) throw new Error('Failed to fetch pest logs');
  return res.json();
}

export async function fetchPestLogById(id: string): Promise<PestLog> {
  const res = await fetch(`/api/pest/logs/${id}`);
  if (!res.ok) throw new Error('Failed to fetch log details');
  return res.json();
}

export async function detectPest(payload: {
  imageBase64?: string;
  imageUrl?: string;
  mimeType?: string;
  cropType: string;
  locationName: string;
  latitude: number;
  longitude: number;
  fieldSector: string;
  userId: string;
}): Promise<PestLog> {
  const res = await fetch('/api/pest/detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to detect pest with AI vision');
  }
  return res.json();
}

export async function createDecision(decisionData: {
  log_id: string;
  user_id: string;
  action_type: string;
  treatment_name: string;
  dosage: string;
  cost_usd: number;
  decision_rationale: string;
  applied_date?: string;
}): Promise<DecisionRecord> {
  const res = await fetch('/api/decisions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(decisionData),
  });
  if (!res.ok) throw new Error('Failed to record decision');
  return res.json();
}

export async function fetchDecisionHistory(): Promise<any[]> {
  const res = await fetch('/api/decisions/history');
  if (!res.ok) throw new Error('Failed to fetch decision history');
  return res.json();
}

export async function createImpactAssessment(impactData: {
  decision_id: string;
  log_id: string;
  pest_reduction_percent: number;
  yield_protected_kg: number;
  estimated_loss_prevented_usd: number;
  chemical_load_reduced_percent: number;
  beneficial_insects_preserved: boolean;
  outcome_status: string;
  notes: string;
}): Promise<ImpactAssessment> {
  const res = await fetch('/api/impacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(impactData),
  });
  if (!res.ok) throw new Error('Failed to record impact assessment');
  return res.json();
}

export async function fetchRegionalTrends(): Promise<RegionalTrend[]> {
  const res = await fetch('/api/analytics/regional-trends');
  if (!res.ok) throw new Error('Failed to fetch regional trends');
  return res.json();
}

export async function executeSqlQuery(sql: string): Promise<{
  columns: string[];
  values: any[][];
  rowCount: number;
  executionTimeMs: string;
  message?: string;
}> {
  const res = await fetch('/api/sql/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'SQL query error');
  return data;
}

export async function fetchSqlSchema(): Promise<{ tables: any[] }> {
  const res = await fetch('/api/sql/schema');
  if (!res.ok) throw new Error('Failed to fetch SQL schema');
  return res.json();
}

export async function resetDatabase(): Promise<{ message: string }> {
  const res = await fetch('/api/database/reset', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset database');
  return res.json();
}
