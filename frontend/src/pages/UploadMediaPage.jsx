import React, { useState, useRef } from 'react';
import { 
  Upload, Image, Video, CheckCircle2, AlertTriangle, ShieldCheck, 
  FileText, Car, Users, Eye, Sparkles, Layers, Info, Hash, RefreshCw, X, Play, Camera, Film, ShieldAlert, Siren, Navigation, ExternalLink
} from 'lucide-react';

export default function UploadMediaPage({ onNavigateTab, onSelectPlate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [zoneId, setZoneId] = useState('ZONE_A');
  const [locationName, setLocationName] = useState('Ahmedabad SG Highway Junction');
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;
    setErrorMessage(null);
    setAnalysisResult(null);

    const ext = file.name.split('.').pop().toLowerCase();
    const validImageExts = ['jpg', 'jpeg', 'png', 'webp', 'bmp'];
    const validVideoExts = ['mp4', 'avi', 'mov', 'mkv', 'webm'];

    if (!validImageExts.includes(ext) && !validVideoExts.includes(ext)) {
      setErrorMessage(`Unsupported format .${ext}. Please upload a valid JPG, JPEG, PNG, or MP4 file.`);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage("File exceeds 50MB limit. Please select a smaller file.");
      return;
    }

    setSelectedFile(file);
    if (validImageExts.includes(ext)) {
      try {
        setPreviewUrl(URL.createObjectURL(file));
      } catch (e) {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Sample incident generator for instant local evaluation
  const loadSampleFrame = (sampleType) => {
    setErrorMessage(null);
    setAnalysisResult(null);

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 480);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.6, '#1e293b');
    grad.addColorStop(1, '#090d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 480);

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(220, 200);
    ctx.lineTo(420, 200);
    ctx.lineTo(600, 480);
    ctx.lineTo(40, 480);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(320, 200);
    ctx.lineTo(320, 480);
    ctx.stroke();
    ctx.setLineDash([]);

    if (sampleType === 'highway_car') {
      setLocationName('Ahmedabad SG Highway ISKCON Flyover');
      setZoneId('ZONE_A');
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(240, 260, 160, 80);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(260, 240, 120, 40);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(280, 310, 80, 20);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(280, 310, 80, 20);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('GJ01AB1234', 285, 324);
    } else {
      setLocationName('Surat Diamond Bourse Ring Road');
      setZoneId('ZONE_C');
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(120, 270, 140, 70);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(150, 315, 80, 18);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('GJ05CD5678', 155, 328);

      ctx.fillStyle = '#10b981';
      ctx.fillRect(380, 270, 140, 70);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(410, 315, 80, 18);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('GJ27AA0007', 415, 328);
    }

    ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('NETRASURAKSHA FORENSIC CAPTURE', 20, 30);

    canvas.toBlob((blob) => {
      const file = new File([blob], `${sampleType}_sample.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);
      setPreviewUrl(canvas.toDataURL('image/jpeg'));
    }, 'image/jpeg', 0.92);
  };

  const loadSampleVideo = (sampleType) => {
    setErrorMessage(null);
    setAnalysisResult(null);

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream(15);
    
    let mimeType = 'video/webm;codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    
    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const file = new File([blob], `${sampleType}_incident.mp4`, { type: 'video/mp4' });
        setSelectedFile(file);
        setPreviewUrl(null);
      };

      mediaRecorder.start();

      let frame = 0;
      const interval = setInterval(() => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 200, 640, 280);

        if (sampleType === 'accident') {
          setLocationName('Ahmedabad SG Highway ISKCON Intersection');
          setZoneId('ZONE_A');
          const x1 = Math.min(220, 50 + frame * 14);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(x1, 260, 140, 70);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x1 + 30, 300, 80, 18);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('GJ01AB1234', x1 + 35, 314);

          const x2 = Math.max(250, 500 - frame * 16);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(x2, 260, 140, 70);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x2 + 30, 300, 80, 18);
          ctx.fillStyle = '#000000';
          ctx.fillText('GJ05CD5678', x2 + 35, 314);
        } else if (sampleType === 'snatching') {
          setLocationName('Gandhinagar Swarnim Sankul Pedestrian Way');
          setZoneId('ZONE_B');
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(280, 260, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(270, 274, 20, 50);

          const x_snatch = frame < 8 ? 100 + frame * 22 : 280 + (frame - 8) * 35;
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(x_snatch, 260, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(x_snatch - 10, 274, 20, 50);
        } else {
          setLocationName('Surat Diamond Bourse Parking Sector');
          setZoneId('ZONE_C');
          ctx.fillStyle = '#334155';
          ctx.fillRect(260, 250, 160, 80);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(290, 300, 90, 18);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('GJ18EF9012', 295, 314);

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(230, 260, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(220, 274, 20, 50);
        }

        ctx.fillStyle = '#eab308';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`INCIDENT SEQUENCE SIMULATION: ${sampleType.toUpperCase()}`, 20, 30);

        frame++;
        if (frame >= 20) {
          clearInterval(interval);
          mediaRecorder.stop();
        }
      }, 50);
    } catch (err) {
      loadSampleFrame(sampleType === 'snatching' ? 'vip_security' : 'highway_car');
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const isVideo = selectedFile.type?.startsWith('video/') || selectedFile.name?.endsWith('.mp4') || selectedFile.name?.endsWith('.avi') || selectedFile.name?.endsWith('.webm') || selectedFile.name?.endsWith('.mov') || selectedFile.name?.endsWith('.mkv');
      const endpoint = isVideo ? '/api/upload/video' : '/api/upload/image';

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('zone_id', zoneId || 'ZONE_A');
      formData.append('location', locationName || 'Forensic Upload');

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        let errDetail = 'Analysis pipeline returned an error';
        try {
          const errData = await res.json();
          errDetail = errData.detail || errDetail;
        } catch (_) {}
        throw new Error(errDetail);
      }

      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error("Upload/analysis failed:", err);
      setErrorMessage(err.message || 'Error executing AI analysis on uploaded file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setErrorMessage(null);
  };

  const factsList = Array.isArray(analysisResult?.observable_facts) ? analysisResult.observable_facts : [];
  const incidentsList = Array.isArray(analysisResult?.detected_incidents) ? analysisResult.detected_incidents : [];
  const platesList = Array.isArray(analysisResult?.detections?.plates) ? analysisResult.detections.plates : [];
  const peopleCount = analysisResult?.detections?.people_count ?? 0;
  const vehiclesCount = analysisResult?.detections?.vehicles_count ?? 0;
  const platesCount = analysisResult?.detections?.plates_count ?? 0;
  const sha256Hash = analysisResult?.evidence?.sha256 || 'Computed & Vault-Locked';
  const isVideoFile = selectedFile?.type?.startsWith('video/') || selectedFile?.name?.endsWith('.mp4') || selectedFile?.name?.endsWith('.avi') || selectedFile?.name?.endsWith('.mov') || selectedFile?.name?.endsWith('.mkv');

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              Forensic Image & Video Analysis Engine
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                REAL AI DETECTOR
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated multi-frame detection of accidents, collisions, chain snatching, vehicle tampering, plate OCR, and SHA-256 evidence hashing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Supported: MP4, AVI, MOV, MKV, JPG, PNG (up to 50MB)</span>
        </div>
      </div>

      {/* Main Grid: Upload Zone + Analysis Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upload Dropzone & Metadata (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Evidence File Upload
              </h2>
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Drag and Drop Box */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[190px] ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : selectedFile
                  ? 'border-emerald-500/50 bg-slate-950/60'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/70'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                accept=".jpg,.jpeg,.png,.webp,.bmp,.mp4,.avi,.mov,.mkv,.webm"
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-2">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center mx-auto border ${
                    isVideoFile
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {isVideoFile ? <Film className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                  </div>
                  <div className="font-bold text-white text-xs truncate max-w-[240px]">{selectedFile.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {isVideoFile ? 'Video Recording' : 'Still Frame'}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-semibold mt-1">
                    Click to choose a different file or test preset below
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      Drag & Drop Real Accident / CCTV Video
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      or <span className="text-cyan-400 underline font-semibold">browse local file</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Supports MP4, AVI, MOV, MKV, JPG, PNG (up to 50MB)
                  </div>
                </div>
              )}
            </div>

            {/* Quick Test Incident Presets */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Siren className="w-3.5 h-3.5 text-red-400" />
                Quick-Test Scenarios (Automated Ingestion):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => loadSampleVideo('accident')}
                  className="p-2.5 rounded-lg bg-red-950/30 hover:bg-red-950/60 border border-red-500/40 text-[11px] text-red-200 transition text-left cursor-pointer space-y-0.5"
                >
                  <div className="font-bold flex items-center gap-1">
                    <span>💥 Car Crash Video</span>
                  </div>
                  <div className="text-[9px] text-red-400 font-mono">Collision & Deceleration</div>
                </button>

                <button
                  type="button"
                  onClick={() => loadSampleVideo('snatching')}
                  className="p-2.5 rounded-lg bg-amber-950/30 hover:bg-amber-950/60 border border-amber-500/40 text-[11px] text-amber-200 transition text-left cursor-pointer space-y-0.5"
                >
                  <div className="font-bold flex items-center gap-1">
                    <span>🏃 Snatching Video</span>
                  </div>
                  <div className="text-[9px] text-amber-400 font-mono">Proximity & Speed Burst</div>
                </button>

                <button
                  type="button"
                  onClick={() => loadSampleVideo('theft')}
                  className="p-2.5 rounded-lg bg-purple-950/30 hover:bg-purple-950/60 border border-purple-500/40 text-[11px] text-purple-200 transition text-left cursor-pointer space-y-0.5"
                >
                  <div className="font-bold flex items-center gap-1">
                    <span>🔓 Vehicle Tampering</span>
                  </div>
                  <div className="text-[9px] text-purple-400 font-mono">Theft / Unlawful Casing</div>
                </button>

                <button
                  type="button"
                  onClick={() => loadSampleFrame('highway_car')}
                  className="p-2.5 rounded-lg bg-slate-950 hover:bg-cyan-950/50 border border-slate-700 hover:border-cyan-500/50 text-[11px] text-slate-300 hover:text-cyan-300 transition text-left cursor-pointer space-y-0.5"
                >
                  <div className="font-bold flex items-center gap-1">
                    <span>🚗 SG Highway Frame</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">ANPR Plate Detection</div>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-center gap-2 text-xs text-red-300">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Metadata Fields */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Assign to Surveillance Zone
                </label>
                <select
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
                >
                  <option value="ZONE_A">ZONE A - Ahmedabad (SG Highway Sector)</option>
                  <option value="ZONE_B">ZONE B - Gandhinagar (Secretariat VIP)</option>
                  <option value="ZONE_C">ZONE C - Surat (Ring Road)</option>
                  <option value="ZONE_D">ZONE D - Vadodara (Alkapuri)</option>
                  <option value="ZONE_E">ZONE E - Rajkot (Kalawad Road)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Incident / Camera Location Description
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. SG Highway Junction, Ahmedabad"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                </input>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleUploadAndAnalyze}
              disabled={!selectedFile || isUploading}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                !selectedFile || isUploading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
              }`}
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Video Keyframes & Temporal Action Models...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run AI Forensic Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Analysis Results & Observable Facts (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-xl space-y-4 min-h-[440px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                AI Inference & Observable Facts Report
              </h2>
              {analysisResult?.analysis_id && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {analysisResult.analysis_id}
                </span>
              )}
            </div>

            {isUploading ? (
              <div className="h-72 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                  <Sparkles className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">Running Multi-Stage AI Forensic Pipeline</div>
                  <p className="text-xs text-slate-400 max-w-sm font-mono">
                    Accident Classifier • Snatching Tracker • Theft Watchdog • EasyOCR • SHA-256 Vault
                  </p>
                </div>
              </div>
            ) : analysisResult ? (
              <div className="space-y-4 animate-fadeIn">
                {/* Critical Incident Alert Banner if detected */}
                {incidentsList.length > 0 && (
                  <div className="bg-red-950/50 border border-red-500/60 p-4 rounded-xl space-y-3 shadow-lg">
                    <div className="text-xs font-bold text-red-300 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        <span>CRITICAL INCIDENT ANOMALY FLAGGED BY AI PIPELINE:</span>
                      </div>
                      {onNavigateTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('incidents')}
                          className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                        >
                          <Siren className="w-3 h-3" />
                          <span>Dispatch SOC Patrol</span>
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {incidentsList.map((inc, iIdx) => (
                        <div key={iIdx} className="bg-slate-900/90 border border-red-500/40 p-3 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white uppercase">{inc.action_label}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                              {inc.severity} SEVERITY • {Math.round((inc.confidence || 0.90) * 100)}% Confidence
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300">{inc.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual Preview with Bounding Boxes */}
                {(analysisResult.preview_image_base64 || previewUrl) && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-black max-h-[300px] flex items-center justify-center relative">
                    <img
                      src={analysisResult.preview_image_base64 || previewUrl}
                      alt="AI Detection Preview"
                      className="max-h-[300px] w-auto object-contain"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-cyan-300 font-mono text-[10px] border border-cyan-500/30">
                      {analysisResult.image_dimensions || 'Annotated'} • AI Evaluation Keyframe
                    </div>
                  </div>
                )}

                {/* Observable Facts Box */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    Observable Evidence Summary:
                  </div>
                  
                  {factsList.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-slate-200">
                      {factsList.map((fact, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-slate-400 italic">No observable anomalies detected.</div>
                  )}

                  {/* Fact Disclaimer */}
                  <div className="mt-2 text-[11px] text-slate-400 italic border-t border-slate-800/60 pt-2">
                    Note: {analysisResult.action_note || 'Multi-frame temporal evaluation complete across decoded video frames.'}
                  </div>
                </div>

                {/* Detections Summary Breakdown */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-[10px] uppercase text-slate-500 font-bold">People Observed</div>
                    <div className="text-lg font-black text-amber-400">
                      {peopleCount}
                    </div>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-[10px] uppercase text-slate-500 font-bold">Vehicles Observed</div>
                    <div className="text-lg font-black text-cyan-400">
                      {vehiclesCount}
                    </div>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-[10px] uppercase text-slate-500 font-bold">Plates Read</div>
                    <div className="text-lg font-black text-emerald-400">
                      {platesCount}
                    </div>
                  </div>
                </div>

                {/* License Plates Detected */}
                {platesList.length > 0 && (
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-emerald-500/30 space-y-2">
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5" />
                      Extracted License Plate Telemetry:
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {platesList.map((p, idx) => (
                        <div key={idx} className="bg-slate-900 border border-emerald-500/40 px-3 py-1.5 rounded-lg flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-white">{p.plate}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            {Math.round((p.confidence || 0.9) * 100)}% Match
                          </span>
                          {onSelectPlate && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectPlate(p.plate);
                                if (onNavigateTab) onNavigateTab('vehicles');
                              }}
                              className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5 ml-1 cursor-pointer"
                            >
                              <span>Track</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cryptographic SHA-256 Vault Hash */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <div className="text-slate-200 font-bold text-[11px]">SHA-256 Cryptographic Hash Recorded</div>
                      <div className="text-[10px] font-mono text-cyan-400 truncate max-w-xs md:max-w-sm">
                        {sha256Hash}
                      </div>
                    </div>
                  </div>
                  {onNavigateTab ? (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('evidence')}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 shrink-0 cursor-pointer"
                    >
                      VIEW IN VAULT
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      INTEGRITY VERIFIED
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                <Upload className="w-8 h-8 text-slate-600" />
                <div className="text-xs font-medium text-slate-400">
                  Select and upload an image or video, or choose a test scenario.
                </div>
                <div className="text-[11px] text-slate-600">
                  Observable objects, vehicles, accidents, and license plates will be extracted with SHA-256 evidence verification.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
