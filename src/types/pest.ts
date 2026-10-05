export interface BoundingBox {
  x: number; // percentage 0-100 or normalized
  y: number; // percentage 0-100
  width: number;
  height: number;
  label: string;
  confidence: number;
}

export interface IpmRecommendations {
  biological: string;
  cultural: string;
  chemical: string;
}

export interface PestLog {
  id: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  image_url: string;
  crop_type: string;
  pest_name: string;
  scientific_name: string;
  category: string;
  confidence: number;
  severity_level: 'Low' | 'Moderate' | 'High' | 'Critical';
  severity_score: number; // 0-100
  detected_count: number;
  symptoms: string[];
  bounding_boxes: BoundingBox[];
  location_name: string;
  latitude: number;
  longitude: number;
  field_sector: string;
  ipm_recommendations: IpmRecommendations;
  timestamp: string;
  status: 'Active' | 'Mitigating' | 'Resolved' | 'Quarantined';
  decisions?: DecisionRecord[];
  impacts?: ImpactAssessment[];
}

export interface DecisionRecord {
  id: string;
  log_id: string;
  user_id: string;
  user_name?: string;
  action_type: 'Biological Control' | 'Pheromone Trap' | 'Organic Botanical Spray' | 'Precision Targeted Chemical' | 'Crop Rotation / Sanitation';
  treatment_name: string;
  dosage: string;
  cost_usd: number;
  decision_rationale: string;
  applied_date: string;
  status: 'Applied' | 'Scheduled' | 'In Evaluation' | 'Completed';
}

export interface ImpactAssessment {
  id: string;
  decision_id: string;
  log_id: string;
  evaluation_date: string;
  pest_reduction_percent: number;
  yield_protected_kg: number;
  estimated_loss_prevented_usd: number;
  chemical_load_reduced_percent: number;
  beneficial_insects_preserved: boolean | number;
  outcome_status: 'Highly Effective' | 'Moderate Control' | 'Resistance Observed' | 'Re-infestation';
  notes: string;
}

export interface RegionalTrend {
  id: string;
  region_name: string;
  latitude: number;
  longitude: number;
  pest_name: string;
  crop_type: string;
  infestation_index: number; // 0-100
  weekly_change_pct: number;
  risk_level: 'Critical' | 'Warning' | 'Moderate' | 'Safe';
  active_outbreak_count: number;
  temp_celsius: number;
  humidity_pct: number;
  spread_vector: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  farm_name: string;
  region: string;
  avatar: string;
  created_at: string;
}

export interface PresetPestSample {
  id: string;
  title: string;
  crop: string;
  pest: string;
  scientificName: string;
  severity: 'Critical' | 'High' | 'Moderate' | 'Low';
  description: string;
  thumbnail: string;
}
