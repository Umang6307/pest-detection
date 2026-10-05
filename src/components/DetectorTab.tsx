import React, { useState, useRef, useEffect } from 'react';
import { PestLog, PresetPestSample, UserProfile } from '../types/pest';
import { PRESET_PEST_SAMPLES } from '../data/presets';
import { detectPest } from '../services/api';
import {
  Upload,
  Camera,
  Sparkles,
  Bug,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Database,
  Layers,
  Eye,
  EyeOff,
  Maximize2,
  FileText,
  Compass,
  Zap,
} from 'lucide-react';

interface DetectorTabProps {
  currentUser: UserProfile | null;
  onDetectionComplete: (log: PestLog) => void;
  onOpenDecisionModal: (log: PestLog) => void;
  selectedLogForView?: PestLog | null;
}

export const DetectorTab: React.FC<DetectorTabProps> = ({
  currentUser,
  onDetectionComplete,
  onOpenDecisionModal,
  selectedLogForView,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(
    selectedLogForView?.image_url || PRESET_PEST_SAMPLES[0].thumbnail
  );
  const [cropType, setCropType] = useState<string>(
    selectedLogForView?.crop_type || 'Maize / Corn'
  );
  const [locationName, setLocationName] = useState<string>(
    selectedLogForView?.location_name || 'Des Moines BioAg Field 4'
  );
  const [fieldSector, setFieldSector] = useState<string>(
    selectedLogForView?.field_sector || 'Sector A-North (Plot 12)'
  );
  const [latitude, setLatitude] = useState<number>(
    selectedLogForView?.latitude || 41.5868
  );
  const [longitude, setLongitude] = useState<number>(
    selectedLogForView?.longitude || -93.6250
  );

  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<PestLog | null>(
    selectedLogForView || null
  );
  const [error, setError] = useState<string | null>(null);

  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [hoveredBoxIdx, setHoveredBoxIdx] = useState<number | null>(null);
  const [activeIpmTab, setActiveIpmTab] = useState<'biological' | 'cultural' | 'chemical'>('biological');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // Sync if selectedLogForView changes from parent
  useEffect(() => {
    if (selectedLogForView) {
      setSelectedImage(selectedLogForView.image_url);
      setCropType(selectedLogForView.crop_type);
      setLocationName(selectedLogForView.location_name);
      setFieldSector(selectedLogForView.field_sector);
      setLatitude(selectedLogForView.latitude);
      setLongitude(selectedLogForView.longitude);
      setAnalysisResult(selectedLogForView);
    }
  }, [selectedLogForView]);

  // Handle Preset selection
  const handleSelectPreset = (sample: PresetPestSample) => {
    setSelectedImage(sample.thumbnail);
    setCropType(sample.crop);
    setLocationName('Agronomy Research Station');
    setFieldSector('Quadrant 4');
    setError(null);
    setAnalysisResult(null);
  };

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setAnalysisResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle Camera
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setError('Camera access denied or unavailable on this device.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUri = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImage(dataUri);
      stopCamera();
      setAnalysisResult(null);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Run AI Detection
  const handleRunDetection = async () => {
    if (!selectedImage) {
      setError('Please upload or select an agricultural crop image to analyze.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const result = await detectPest({
        imageBase64: selectedImage.startsWith('data:') ? selectedImage : undefined,
        imageUrl: !selectedImage.startsWith('data:') ? selectedImage : undefined,
        cropType,
        locationName,
        latitude,
        longitude,
        fieldSector,
        userId: currentUser?.id || 'usr-1',
      });

      setAnalysisResult(result);
      onDetectionComplete(result);
    } catch (err: any) {
      setError(err.message || 'Vision model processing encountered an error.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity?.toLowerCase()) {
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

  return (
    <div className="space-y-6">
      {/* Top Banner / Scout Context */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
              <Zap className="w-4 h-4" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Computer Vision Pest Diagnostics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Multimodal deep learning identifies insect species, leaf damage symptoms, and logs detections directly into the SQL database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target: <strong className="text-white">{cropType}</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Auto-Logged: <strong className="text-white">Active SQL Session</strong></span>
          </div>
        </div>
      </div>

      {/* Preset Samples Ribbon (1-Click Instant Testing) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            1-Click Agricultural Preset Samples
          </span>
          <span className="text-slate-500">Click any preset to test image analysis instantly</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {PRESET_PEST_SAMPLES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectPreset(sample)}
              className={`group relative text-left p-2 rounded-xl border transition overflow-hidden ${
                selectedImage === sample.thumbnail
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-slate-950">
                <img
                  src={sample.thumbnail}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <span
                  className={`absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    sample.severity === 'Critical'
                      ? 'bg-red-500 text-white'
                      : sample.severity === 'High'
                      ? 'bg-orange-500 text-white'
                      : sample.severity === 'Moderate'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-emerald-500 text-white'
                  }`}
                >
                  {sample.severity}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-emerald-300 transition">
                {sample.pest}
              </div>
              <div className="text-[10px] text-slate-400 truncate">{sample.crop}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Canvas & Upload Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            {/* Header controls for Image */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Crop Specimen Viewport
              </span>

              <div className="flex items-center space-x-2">
                {analysisResult && (
                  <button
                    onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                    className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  >
                    {showBoundingBoxes ? (
                      <>
                        <EyeOff className="w-3 h-3 text-emerald-400" />
                        <span>Hide Boxes</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3 text-slate-400" />
                        <span>Show Boxes</span>
                      </>
                    )}
                  </button>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload Photo</span>
                </button>

                <button
                  onClick={() => (isCameraActive ? capturePhoto() : startCamera())}
                  className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white transition"
                >
                  <Camera className="w-3 h-3" />
                  <span>{isCameraActive ? 'Capture' : 'Webcam'}</span>
                </button>
              </div>
            </div>

            {/* Viewport Frame with Interactive Bounding Boxes */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group select-none">
              {isCameraActive ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-3">
                    <button
                      onClick={capturePhoto}
                      className="px-4 py-2 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg hover:bg-emerald-400 transition"
                    >
                      Snap Crop Photo
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-3 py-2 rounded-full bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700 hover:bg-slate-700 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : selectedImage ? (
                <div className="relative w-full h-full">
                  <img
                    src={selectedImage}
                    alt="Crop Specimen"
                    className="w-full h-full object-cover"
                  />

                  {/* SVG / HTML Bounding Boxes Overlay */}
                  {showBoundingBoxes && analysisResult?.bounding_boxes && (
                    <div className="absolute inset-0 pointer-events-none">
                      {analysisResult.bounding_boxes.map((box, idx) => {
                        const isHovered = hoveredBoxIdx === idx;
                        return (
                          <div
                            key={idx}
                            style={{
                              left: `${box.x}%`,
                              top: `${box.y}%`,
                              width: `${box.width}%`,
                              height: `${box.height}%`,
                            }}
                            className={`absolute border-2 pointer-events-auto transition-all cursor-pointer ${
                              isHovered
                                ? 'border-emerald-400 bg-emerald-500/25 shadow-lg shadow-emerald-500/30'
                                : 'border-amber-400/90 bg-amber-500/10'
                            }`}
                            onMouseEnter={() => setHoveredBoxIdx(idx)}
                            onMouseLeave={() => setHoveredBoxIdx(null)}
                          >
                            <span className="absolute -top-6 left-0 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-950/90 text-amber-300 border border-amber-500/40 rounded shadow-md whitespace-nowrap">
                              {box.label} ({Math.round(box.confidence * 100)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Visual Analysis Scanning Line Animation when analyzing */}
                  {analyzing && (
                    <div className="absolute inset-0 bg-emerald-950/40 flex flex-col items-center justify-center backdrop-blur-xs">
                      <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-3"></div>
                      <div className="text-sm font-semibold text-emerald-300 tracking-wide animate-pulse">
                        Scanning Image via Multimodal Computer Vision...
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Detecting morphology, frass damage, and lesion patterns
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <Bug className="w-12 h-12 mx-auto text-slate-600" />
                  <p className="text-sm">Select a preset sample or upload an agricultural field photo</p>
                </div>
              )}
            </div>

            {/* Metadata Fields: Crop Type, Field Sector, Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Crop Specimen
                </label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Maize / Corn">Maize / Corn</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Potato">Potato</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Soybean">Soybean</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Leafy Greens / Brassica">Leafy Greens / Brassica</option>
                  <option value="Citrus / Orchards">Citrus / Orchards</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Field / Greenhouse Plot
                </label>
                <input
                  type="text"
                  value={fieldSector}
                  onChange={(e) => setFieldSector(e.target.value)}
                  placeholder="e.g. Pivot North-B"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Regional Location
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Des Moines Corridor, IA"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Error banner if any */}
            {error && (
              <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Main Action Trigger */}
            <button
              onClick={handleRunDetection}
              disabled={analyzing}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-950/50 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></div>
                  <span>Running Computer Vision Model...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Computer Vision Pest Detection</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Diagnostic Report & IPM Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {analysisResult ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
              {/* Header result */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getSeverityBadgeClass(
                        analysisResult.severity_level
                      )}`}
                    >
                      {analysisResult.severity_level} Severity
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Conf: {(analysisResult.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {analysisResult.pest_name}
                  </h2>
                  <p className="text-xs text-emerald-400 italic">
                    {analysisResult.scientific_name} • Order {analysisResult.category}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-white font-mono">
                    {analysisResult.severity_score}
                    <span className="text-xs text-slate-400 font-normal">/100</span>
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Infestation Index
                  </div>
                </div>
              </div>

              {/* Severity Gauge Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Economic Threshold Risk</span>
                  <span className="font-semibold text-slate-300">
                    Est. Individuals: {analysisResult.detected_count}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, analysisResult.severity_score)}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      analysisResult.severity_score > 75
                        ? 'bg-red-500'
                        : analysisResult.severity_score > 50
                        ? 'bg-orange-500'
                        : analysisResult.severity_score > 25
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {/* Visible Crop Symptoms */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Identified Morphological Damage
                </div>
                <ul className="space-y-1.5">
                  {analysisResult.symptoms?.map((symptom, i) => (
                    <li
                      key={i}
                      className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 flex items-start space-x-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{symptom}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Integrated Pest Management (IPM) Tabs */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>IPM Treatment Protocols</span>
                  <span className="text-[10px] text-slate-500">Decision Support System</span>
                </div>

                <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                  <button
                    onClick={() => setActiveIpmTab('biological')}
                    className={`flex-1 py-1 text-xs font-medium rounded-md transition ${
                      activeIpmTab === 'biological'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Biological
                  </button>
                  <button
                    onClick={() => setActiveIpmTab('cultural')}
                    className={`flex-1 py-1 text-xs font-medium rounded-md transition ${
                      activeIpmTab === 'cultural'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Cultural
                  </button>
                  <button
                    onClick={() => setActiveIpmTab('chemical')}
                    className={`flex-1 py-1 text-xs font-medium rounded-md transition ${
                      activeIpmTab === 'chemical'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Precision Chemical
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed min-h-[70px]">
                  {activeIpmTab === 'biological' && (
                    <div>
                      <strong className="text-emerald-400 block mb-1">Biological & Biocontrol Agents:</strong>
                      {analysisResult.ipm_recommendations?.biological ||
                        'Introduce beneficial parasitoid wasps and entomopathogenic bacteria.'}
                    </div>
                  )}
                  {activeIpmTab === 'cultural' && (
                    <div>
                      <strong className="text-amber-400 block mb-1">Cultural & Agronomic Sanitation:</strong>
                      {analysisResult.ipm_recommendations?.cultural ||
                        'Prune infected vegetative terminals and balance irrigation/nitrogen balance.'}
                    </div>
                  )}
                  {activeIpmTab === 'chemical' && (
                    <div>
                      <strong className="text-red-400 block mb-1">Precision Eco-Chemical Thresholds:</strong>
                      {analysisResult.ipm_recommendations?.chemical ||
                        'Selective bio-rational pesticide only if economic threshold surpasses 20% foliage damage.'}
                    </div>
                  )}
                </div>
              </div>

              {/* SQL Database Sync Indicator */}
              <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-800/40 text-[11px] text-blue-300 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>Stored in SQL: <code className="text-white font-mono">{analysisResult.id}</code></span>
                </div>
                <span className="text-emerald-400 font-semibold">Persisted</span>
              </div>

              {/* Action Button: Log Decision */}
              <button
                onClick={() => onOpenDecisionModal(analysisResult)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs transition flex items-center justify-center space-x-2"
              >
                <span>Record Agricultural Decision / Intervention</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-emerald-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">Diagnostic Report Pending</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select an image above and click "Execute Computer Vision Pest Detection". The model will detect pests, generate localized bounding boxes, estimate severity, and automatically store the entry in SQL.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
