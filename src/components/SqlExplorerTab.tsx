import React, { useState, useEffect } from 'react';
import { executeSqlQuery, fetchSqlSchema, resetDatabase } from '../services/api';
import {
  Terminal,
  Database,
  Code2,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Table,
  Cpu,
  Layers,
  FileCode,
} from 'lucide-react';

const PRESET_QUERIES = [
  {
    title: 'Infestation Summary by Pest & Crop',
    sql: `SELECT pest_name, crop_type, COUNT(*) as log_count, AVG(severity_score) as avg_severity, MAX(detected_count) as max_detected
FROM pest_logs
GROUP BY pest_name, crop_type
ORDER BY avg_severity DESC;`,
  },
  {
    title: 'Decision Efficacy & Dollars Protected (JOIN)',
    sql: `SELECT 
  d.action_type,
  d.treatment_name,
  COUNT(i.id) as evaluations_count,
  AVG(i.pest_reduction_percent) as avg_reduction_pct,
  SUM(i.estimated_loss_prevented_usd) as total_dollars_saved,
  AVG(i.chemical_load_reduced_percent) as avg_chem_reduced_pct
FROM decisions d
JOIN impact_assessments i ON d.id = i.decision_id
GROUP BY d.action_type, d.treatment_name
ORDER BY total_dollars_saved DESC;`,
  },
  {
    title: 'High-Risk Regional Infestations & Weather',
    sql: `SELECT region_name, pest_name, infestation_index, risk_level, temp_celsius, humidity_pct, spread_vector
FROM regional_trends
WHERE infestation_index >= 60.0
ORDER BY infestation_index DESC;`,
  },
  {
    title: 'Active Scouts & Assigned Logs Breakdown',
    sql: `SELECT u.name as scout_name, u.role, u.farm_name, COUNT(p.id) as logs_recorded
FROM users u
LEFT JOIN pest_logs p ON u.id = p.user_id
GROUP BY u.id
ORDER BY logs_recorded DESC;`,
  },
  {
    title: 'Full Audit Trail (Users -> Logs -> Decisions)',
    sql: `SELECT 
  p.id as log_id,
  p.timestamp,
  u.name as scout,
  p.pest_name,
  p.severity_level,
  d.treatment_name,
  d.status as decision_status
FROM pest_logs p
JOIN users u ON p.user_id = u.id
LEFT JOIN decisions d ON p.id = d.log_id
ORDER BY p.timestamp DESC;`,
  },
];

const FLASK_CODE_SNIPPET = `"""
AgriVision AI - Python / Flask Model Serving Backend
Serves computer vision pest detection and manages SQL database logs.
"""
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import sqlite3, json, datetime
from google import genai
from google.genai import types

app = Flask(__name__)
CORS(app)
DATABASE = 'agrivision_data.sqlite'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.route('/api/pest/detect', methods=['POST'])
def detect_pest():
    data = request.get_json()
    image_base64 = data.get('imageBase64')
    crop_type = data.get('cropType', 'Corn')
    
    # 1. Computer Vision Deep Learning Inference
    client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))
    response = client.models.generate_content(
        model='gemini-3.8-flash',
        contents=[
            types.Part.from_bytes(data=image_base64, mime_type='image/jpeg'),
            f"Identify pest species, bounding boxes, severity score, and IPM for {crop_type}"
        ],
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )
    result = json.loads(response.text)
    
    # 2. Persist directly into SQL Database
    log_id = f"log-{int(datetime.datetime.utcnow().timestamp())}"
    db = get_db()
    db.execute("""
        INSERT INTO pest_logs (id, user_id, crop_type, pest_name, scientific_name, severity_score, symptoms, bounding_boxes, timestamp, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (log_id, data['userId'], crop_type, result['pest_name'], result['scientific_name'], result['severity_score'], json.dumps(result['symptoms']), json.dumps(result['bounding_boxes']), datetime.datetime.utcnow().isoformat(), 'Active'))
    db.commit()
    
    return jsonify(result), 201

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
`;

export const SqlExplorerTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'console' | 'schema' | 'flask'>('console');
  const [sqlQuery, setSqlQuery] = useState<string>(PRESET_QUERIES[0].sql);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [executing, setExecuting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const [schemaData, setSchemaData] = useState<any>(null);
  const [loadingSchema, setLoadingSchema] = useState<boolean>(false);

  // Execute initial query on mount
  useEffect(() => {
    handleRunQuery(PRESET_QUERIES[0].sql);
    loadSchema();
  }, []);

  const loadSchema = async () => {
    setLoadingSchema(true);
    try {
      const data = await fetchSqlSchema();
      setSchemaData(data);
    } catch (err: any) {
      console.error('Failed to load SQL schema:', err);
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleRunQuery = async (queryToRun?: string) => {
    const q = queryToRun || sqlQuery;
    setExecuting(true);
    setError(null);
    try {
      const res = await executeSqlQuery(q);
      setQueryResult(res);
    } catch (err: any) {
      setError(err.message || 'SQL execution failed');
      setQueryResult(null);
    } finally {
      setExecuting(false);
    }
  };

  const handleResetDb = async () => {
    if (!window.confirm('Reset SQLite database to default initial agronomic seed data?')) return;
    try {
      await resetDatabase();
      loadSchema();
      handleRunQuery(sqlQuery);
      alert('Database successfully reset and re-seeded!');
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    }
  };

  const copyFlaskCode = () => {
    navigator.clipboard.writeText(FLASK_CODE_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-navigation */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
              <Terminal className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              SQL Engine & Backend Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Query live relational tables, inspect relational schemas, or explore the Python/Flask model serving architecture.
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setSubTab('console')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              subTab === 'console'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live SQL Terminal
          </button>
          <button
            onClick={() => setSubTab('schema')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              subTab === 'schema'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Relational Schema
          </button>
          <button
            onClick={() => setSubTab('flask')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              subTab === 'flask'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Python / Flask Backend
          </button>
        </div>
      </div>

      {/* Subtab 1: SQL Terminal */}
      {subTab === 'console' && (
        <div className="space-y-4">
          {/* Preset query badges */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Agronomic SQL Query Presets:
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_QUERIES.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSqlQuery(preset.sql);
                    handleRunQuery(preset.sql);
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          {/* SQL Editor Area */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                SQLite Interactive Console
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleResetDb}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Seed Data</span>
                </button>
                <button
                  onClick={() => handleRunQuery()}
                  disabled={executing}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 transition flex items-center space-x-1"
                >
                  <Play className="w-3 h-3 fill-slate-950" />
                  <span>{executing ? 'Executing...' : 'Run Query (F5)'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-950">
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={5}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 resize-y"
                placeholder="Enter SQL statement (e.g. SELECT * FROM pest_logs;)"
              />
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 bg-red-950/60 border-t border-red-800/80 text-xs text-red-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="font-mono">{error}</span>
              </div>
            )}

            {/* Results Table */}
            {queryResult && (
              <div className="border-t border-slate-800">
                <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>
                    Returned <strong>{queryResult.rowCount}</strong> rows
                  </span>
                  <span>Execution time: {queryResult.executionTimeMs} ms</span>
                </div>

                <div className="overflow-x-auto max-h-96">
                  {queryResult.columns && queryResult.columns.length > 0 ? (
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
                        <tr>
                          {queryResult.columns.map((col: string, idx: number) => (
                            <th key={idx} className="py-2.5 px-4 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {queryResult.values.map((row: any[], rowIdx: number) => (
                          <tr key={rowIdx} className="hover:bg-slate-800/40 transition">
                            {row.map((cell: any, cellIdx: number) => (
                              <td key={cellIdx} className="py-2 px-4 whitespace-nowrap max-w-xs truncate">
                                {cell === null ? (
                                  <span className="text-slate-600 italic">NULL</span>
                                ) : typeof cell === 'number' ? (
                                  <span className="text-amber-400">{cell}</span>
                                ) : (
                                  <span>{String(cell)}</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      {queryResult.message || 'Query executed successfully with no returned rows.'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab 2: Schema Explorer */}
      {subTab === 'schema' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schemaData?.tables?.map((table: any, idx: number) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <Table className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm font-mono">
                      {table.name}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {table.rowCount} records
                  </span>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {table.columns?.map((col: any, cIdx: number) => (
                    <div
                      key={cIdx}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs font-mono"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-slate-200">
                          {col.name}
                        </span>
                        {col.pk && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-amber-500/20 text-amber-300 rounded font-bold">
                            PK
                          </span>
                        )}
                      </div>
                      <span className="text-emerald-400/90 text-[11px]">
                        {col.type || 'TEXT'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 3: Flask Python Backend Architecture */}
      {subTab === 'flask' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                Python & Flask Model Serving Architecture
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Full-fidelity Python backend files located in <code className="text-emerald-400 font-mono">/backend_flask/app.py</code> and <code className="text-emerald-400 font-mono">/backend_flask/schema.sql</code>.
              </p>
            </div>

            <button
              onClick={copyFlaskCode}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition flex items-center space-x-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy Flask Code'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-emerald-400 font-semibold block">1. Computer Vision Serving</span>
              <p className="text-slate-400 text-[11px]">
                Flask processes image multipart uploads or base64 payloads, invokes multimodal computer vision models, and extracts bounding boxes.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-blue-400 font-semibold block">2. Relational SQL Persistence</span>
              <p className="text-slate-400 text-[11px]">
                Detailed analysis logs, user credentials, and intervention impact histories are recorded via SQLite or PostgreSQL with full audit integrity.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-purple-400 font-semibold block">3. Regional Infestation Trends</span>
              <p className="text-slate-400 text-[11px]">
                Aggregates spatial coordinate trends, infection velocity, and weather correlation feeds for the interactive dashboard map.
              </p>
            </div>
          </div>

          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto text-xs font-mono text-emerald-300 max-h-96 leading-relaxed">
            {FLASK_CODE_SNIPPET}
          </pre>
        </div>
      )}
    </div>
  );
};
