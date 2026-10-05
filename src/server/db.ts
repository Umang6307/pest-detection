import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(process.cwd(), 'agrivision_data.sqlite');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const filebuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(filebuffer);
    } catch (e) {
      console.warn('Failed to load existing SQLite file, creating new database', e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initSchema(dbInstance);
  saveDb(dbInstance);
  return dbInstance;
}

export function saveDb(db: Database = dbInstance!) {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist SQLite database:', err);
  }
}

function initSchema(db: Database) {
  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      farm_name TEXT NOT NULL,
      region TEXT NOT NULL,
      avatar TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pest_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      crop_type TEXT NOT NULL,
      pest_name TEXT NOT NULL,
      scientific_name TEXT NOT NULL,
      category TEXT NOT NULL,
      confidence REAL NOT NULL,
      severity_level TEXT NOT NULL,
      severity_score INTEGER NOT NULL,
      detected_count INTEGER NOT NULL,
      symptoms TEXT NOT NULL,
      bounding_boxes TEXT NOT NULL,
      location_name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      field_sector TEXT NOT NULL,
      ipm_recommendations TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      log_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      treatment_name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      cost_usd REAL NOT NULL,
      decision_rationale TEXT NOT NULL,
      applied_date TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (log_id) REFERENCES pest_logs(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS impact_assessments (
      id TEXT PRIMARY KEY,
      decision_id TEXT NOT NULL,
      log_id TEXT NOT NULL,
      evaluation_date TEXT NOT NULL,
      pest_reduction_percent REAL NOT NULL,
      yield_protected_kg REAL NOT NULL,
      estimated_loss_prevented_usd REAL NOT NULL,
      chemical_load_reduced_percent REAL NOT NULL,
      beneficial_insects_preserved INTEGER NOT NULL,
      outcome_status TEXT NOT NULL,
      notes TEXT NOT NULL,
      FOREIGN KEY (decision_id) REFERENCES decisions(id),
      FOREIGN KEY (log_id) REFERENCES pest_logs(id)
    );

    CREATE TABLE IF NOT EXISTS regional_trends (
      id TEXT PRIMARY KEY,
      region_name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      pest_name TEXT NOT NULL,
      crop_type TEXT NOT NULL,
      infestation_index REAL NOT NULL,
      weekly_change_pct REAL NOT NULL,
      risk_level TEXT NOT NULL,
      active_outbreak_count INTEGER NOT NULL,
      temp_celsius REAL NOT NULL,
      humidity_pct REAL NOT NULL,
      spread_vector TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Seed sample data if empty
  const userCheck = db.exec("SELECT COUNT(*) as count FROM users");
  const count = userCheck[0]?.values[0]?.[0] as number;

  if (!count || count === 0) {
    seedInitialData(db);
  }
}

function seedInitialData(db: Database) {
  // Seed Users
  db.run(`
    INSERT INTO users (id, name, email, role, farm_name, region, avatar, created_at) VALUES
    ('usr-1', 'Dr. Elena Vance', 'elena.vance@agrivision.io', 'Lead Agronomist & Pathologist', 'Midwest BioAg Research', 'Midwest Corn Belt (Iowa)', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', '2026-08-10T08:00:00Z'),
    ('usr-2', 'Marcus Sterling', 'm.sterling@sunvalleyfarms.com', 'Farm Operations Director', 'Sun Valley Agribusiness', 'Central Valley (California)', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80', '2026-08-15T09:30:00Z'),
    ('usr-3', 'Amara Chen', 'amara.chen@greencrop.org', 'Senior Field Scout', 'Green Delta Cooperatives', 'Mississippi Delta (Arkansas)', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', '2026-09-01T11:00:00Z'),
    ('usr-4', 'Carlos Mendez', 'carlos.m@agriextension.edu', 'IPM Extension Specialist', 'State Agricultural Extension', 'High Plains (Kansas)', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', '2026-09-12T14:15:00Z');
  `);

  // Seed Regional Trends for the interactive map
  db.run(`
    INSERT INTO regional_trends (id, region_name, latitude, longitude, pest_name, crop_type, infestation_index, weekly_change_pct, risk_level, active_outbreak_count, temp_celsius, humidity_pct, spread_vector, updated_at) VALUES
    ('reg-1', 'Des Moines Agricultural Corridor, IA', 41.5868, -93.6250, 'Fall Armyworm (Spodoptera frugiperda)', 'Maize / Corn', 84.5, 14.2, 'Critical', 28, 27.4, 76.0, 'North-East 18km/day', '2026-10-04T12:00:00Z'),
    ('reg-2', 'San Joaquin Valley Sector 4, CA', 36.7378, -119.7871, 'Two-Spotted Spider Mite (Tetranychus urticae)', 'Almonds & Tomatoes', 68.2, -4.5, 'Warning', 19, 31.8, 42.0, 'Static / Localized', '2026-10-04T10:30:00Z'),
    ('reg-3', 'Mississippi Alluvial Plain, AR', 34.7465, -92.2896, 'Cotton Bollworm (Helicoverpa zea)', 'Cotton & Soybeans', 76.0, 8.8, 'Critical', 24, 29.1, 82.0, 'East 12km/day', '2026-10-03T16:00:00Z'),
    ('reg-4', 'Salinas Valley Coastal Basin, CA', 36.6777, -121.6555, 'Green Peach Aphid (Myzus persicae)', 'Leafy Greens & Brassicas', 49.3, -12.1, 'Moderate', 11, 21.5, 68.0, 'South 6km/day', '2026-10-05T08:00:00Z'),
    ('reg-5', 'Red River Valley, ND/MN', 47.9253, -97.0328, 'Soybean Aphid (Aphis glycines)', 'Soybean', 58.7, 5.3, 'Warning', 15, 22.0, 65.0, 'South-East 9km/day', '2026-10-04T14:45:00Z'),
    ('reg-6', 'Yakima Valley Fruit Belt, WA', 46.6021, -120.5059, 'Codling Moth (Cydia pomonella)', 'Apples & Pears', 32.4, -6.8, 'Safe', 6, 23.8, 48.0, 'Declining', '2026-10-03T18:00:00Z'),
    ('reg-7', 'Treasure Valley Basin, ID/OR', 43.6150, -116.2023, 'Colorado Potato Beetle (Leptinotarsa decemlineata)', 'Potato & Onion', 62.1, 3.4, 'Warning', 13, 25.2, 51.0, 'North-West 7km/day', '2026-10-04T09:15:00Z'),
    ('reg-8', 'Lake Okeechobee Ag Area, FL', 26.7153, -80.9567, 'Silverleaf Whitefly (Bemisia tabaci)', 'Sugarcane & Vegetables', 81.0, 11.5, 'Critical', 31, 30.5, 88.0, 'North 15km/day', '2026-10-05T11:00:00Z');
  `);

  // Seed Detailed Pest Logs
  db.run(`
    INSERT INTO pest_logs (id, user_id, image_url, crop_type, pest_name, scientific_name, category, confidence, severity_level, severity_score, detected_count, symptoms, bounding_boxes, location_name, latitude, longitude, field_sector, ipm_recommendations, timestamp, status) VALUES
    ('log-101', 'usr-1', 'https://images.unsplash.com/photo-1595113316349-9fa4eb24f884?w=800&auto=format&fit=crop&q=80', 'Maize / Corn', 'Fall Armyworm', 'Spodoptera frugiperda', 'Lepidoptera', 0.96, 'Critical', 88, 14, 
     '["Window-pane leaf damage", "Extensive frass accumulation in whorl", "Shot-hole perforations on leaves", "Ragged leaf margins"]',
     '[{"x":18,"y":24,"width":32,"height":28,"label":"Larva feeding whorl","confidence":0.97},{"x":58,"y":42,"width":26,"height":31,"label":"Frass & leaf chewing","confidence":0.94}]',
     'Des Moines Ag Research Field 4', 41.5868, -93.6250, 'Sector B-North (Plot 14)',
     '{"biological":"Introduce parasitic wasps (Trichogramma pretiosum) and Bacillus thuringiensis (Bt) kurstaki formulation.","cultural":"Early whorl scouting, intercropping with Desmodium trap-crop push-pull technique.","chemical":"Targeted Spinetoram application only if whorl infestation exceeds 20% threshold to avoid pollinator harm."}',
     '2026-09-28T09:14:00Z', 'Mitigating'),

    ('log-102', 'usr-2', 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&auto=format&fit=crop&q=80', 'Tomato', 'Two-Spotted Spider Mite', 'Tetranychus urticae', 'Acari', 0.92, 'High', 74, 45,
     '["Fine silken webbing on abaxial leaf", "Chlorotic stippling on upper canopy", "Leaf bronzing and premature desiccation"]',
     '[{"x":30,"y":35,"width":40,"height":35,"label":"Mite colony & silk webbing","confidence":0.93},{"x":72,"y":60,"width":20,"height":22,"label":"Chlorotic stippling","confidence":0.89}]',
     'Sun Valley Central Greenhouse 2', 36.7378, -119.7871, 'Tunnel 2 - Rows 18-24',
     '{"biological":"Release predatory phytoseiid mites (Phytoseiulus persimilis) at 5 per plant.","cultural":"Maintain overhead humidity >60% to suppress mite reproductive cycles; remove dusty border weeds.","chemical":"Selective bio-miticide (Azadirachtin or potassium salts of fatty acids); avoid broad-spectrum pyrethroids."}',
     '2026-09-30T14:22:00Z', 'Resolved'),

    ('log-103', 'usr-3', 'https://images.unsplash.com/photo-1592417817098-8f3d6ef2c6e3?w=800&auto=format&fit=crop&q=80', 'Cotton', 'Cotton Bollworm / Corn Earworm', 'Helicoverpa zea', 'Lepidoptera', 0.94, 'Critical', 82, 8,
     '["Hollowed squares and young bolls", "Entry hole boreholes with moist frass", "Floral bud shedding"]',
     '[{"x":42,"y":20,"width":30,"height":38,"label":"Boll entry borehole","confidence":0.95}]',
     'Delta Valley Farm West Block', 34.7465, -92.2896, 'Delta Pivot C',
     '{"biological":"Apply Helicoverpa nucleopolyhedrovirus (HearNPV) for targeted larval mortality.","cultural":"Plant early maturing cultivars to escape peak moth flight generations; manage cover crops.","chemical":"Chlorantraniliprole targeted spray if egg count exceeds 15 per 100 plants."}',
     '2026-10-02T10:05:00Z', 'Active'),

    ('log-104', 'usr-4', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80', 'Potato', 'Colorado Potato Beetle', 'Leptinotarsa decemlineata', 'Coleoptera', 0.98, 'High', 79, 18,
     '["Heavy defoliation on apical leaves", "Clustered orange-yellow egg masses under leaves", "Striped adult beetles feeding on foliage"]',
     '[{"x":25,"y":30,"width":35,"height":30,"label":"Adult beetle mating pair","confidence":0.98},{"x":65,"y":55,"width":25,"height":25,"label":"Defoliated stem","confidence":0.92}]',
     'High Plains Agronomy Station', 43.6150, -116.2023, 'Sector P-8',
     '{"biological":"Apply Bacillus thuringiensis subsp. tenebrionis or Beauveria bassiana entomopathogenic fungus.","cultural":"Crop rotation with non-solanaceous crops (min 400m distance from previous year potato fields).","chemical":"Spinosad or Novaluron insect growth regulator; rotate MoA classes to combat known pesticide resistance."}',
     '2026-10-03T16:40:00Z', 'Mitigating');
  `);

  // Seed Decisions History
  db.run(`
    INSERT INTO decisions (id, log_id, user_id, action_type, treatment_name, dosage, cost_usd, decision_rationale, applied_date, status) VALUES
    ('dec-201', 'log-101', 'usr-1', 'Biological Control', 'Trichogramma Wasps + Bt Kurstaki', '100,000 parasitoids/ha + 1.2 kg/ha Bt', 340.00, 'Threshold reached 22% leaf whorl damage. Selected biological parasitoids to protect beneficial Ladybird beetles and pollinators.', '2026-09-29T06:30:00Z', 'Completed'),
    ('dec-202', 'log-102', 'usr-2', 'Biological Control', 'Phytoseiulus persimilis predatory mites', '6 predatory mites per plant (12,000 total)', 210.00, 'Microclimate greenhouse trial. High density predatory mite introduction to achieve zero pesticide residue for organic certification.', '2026-10-01T08:00:00Z', 'Completed'),
    ('dec-203', 'log-103', 'usr-3', 'Precision Targeted Chemical', 'Chlorantraniliprole (Coragen)', '150 ml/ha spot application', 420.00, 'Square damage reached economic injury level (EIL). Precision nozzle drone spray targeted strictly to infected Pivot C sectors.', '2026-10-02T18:00:00Z', 'Applied'),
    ('dec-204', 'log-104', 'usr-4', 'Biological Control', 'Beauveria bassiana (Botanigard 22WP)', '2.5 lbs/acre foliage wash', 285.00, 'Targeting late 2nd-instar larvae with fungal biocontrol to halt emergence of 2nd generational adults before tuber bulking stage.', '2026-10-04T07:15:00Z', 'Applied');
  `);

  // Seed Impact Assessments
  db.run(`
    INSERT INTO impact_assessments (id, decision_id, log_id, evaluation_date, pest_reduction_percent, yield_protected_kg, estimated_loss_prevented_usd, chemical_load_reduced_percent, beneficial_insects_preserved, outcome_status, notes) VALUES
    ('imp-301', 'dec-201', 'log-101', '2026-10-04T14:00:00Z', 87.5, 4200.0, 3150.00, 92.0, 1, 'Highly Effective', 'Whorl feeding ceased in 96 hours. 87.5% drop in viable larvae counts. Surrounding beneficial predator counts increased by 34%. Projected harvest protected.'),
    ('imp-302', 'dec-202', 'log-102', '2026-10-05T09:30:00Z', 94.0, 1850.0, 4200.00, 100.0, 1, 'Highly Effective', 'Zero broad-spectrum chemicals used. Mite populations reduced below detectable economic damage. Leaves regenerated without chlorosis. Greenhouse organic grade preserved.'),
    ('imp-303', 'dec-203', 'log-103', '2026-10-04T17:00:00Z', 79.0, 2900.0, 5600.00, 68.0, 1, 'Moderate Control', 'Larval boring arrested in 79% of sampled cotton bolls. Drone application prevented pesticide drift into adjacent creek basin.');
  `);
}
