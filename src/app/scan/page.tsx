'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  ScanLine, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Save, 
  FileSpreadsheet,
  ArrowRight,
  Camera,
  RotateCcw,
  X,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { Student } from '@/lib/supabase';

export default function RegisterScannerPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [extractedRows, setExtractedRows] = useState<Partial<Student>[]>([]);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);

  // Existing Admission Numbers from Supabase for duplicate check
  const [existingAdmissionNos, setExistingAdmissionNos] = useState<Set<string>>(new Set());

  // Camera Modal State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch existing students to check for duplicate admission numbers
  useEffect(() => {
    fetch('/api/students')
      .then((res) => res.json())
      .then((data) => {
        if (data.students) {
          const admSet = new Set<string>(data.students.map((s: Student) => String(s.admission_no).trim()));
          setExistingAdmissionNos(admSet);
        }
      })
      .catch((err) => console.error('Failed to load admission list:', err));
  }, []);

  // Handle File Input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportSuccess(null);
      setWarningMessage(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error(err);
      setCameraError('Unable to access camera. Please allow camera permissions or upload an image file.');
    }
  };

  const handleOpenLiveCamera = () => {
    setShowCameraModal(true);
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  const handleCloseCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const handleFlipCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
  };

  useEffect(() => {
    if (showCameraModal) {
      startCamera();
    }
  }, [cameraFacing]);

  // Capture frame from live video
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setImagePreview(dataUrl);
      setSelectedFile(null);
      handleCloseCamera();
    }
  };

  const handleStartExtraction = async () => {
    if (!imagePreview) {
      alert('Please select or capture a register page image first.');
      return;
    }

    setExtracting(true);
    setWarningMessage(null);
    setImportSuccess(null);

    try {
      const res = await fetch('/api/extract-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: selectedFile?.type || 'image/jpeg',
        }),
      });

      const data = await res.json();

      if (data.warning) {
        setWarningMessage(data.warning);
      }

      if (data.students && Array.isArray(data.students)) {
        setExtractedRows(data.students);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      alert('Failed to connect to extraction server.');
    } finally {
      setExtracting(false);
    }
  };

  // Edit cell helper
  const handleCellChange = (index: number, field: keyof Student, value: any) => {
    const updated = [...extractedRows];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedRows(updated);
  };

  // Delete row helper
  const handleDeleteRow = (index: number) => {
    setExtractedRows(extractedRows.filter((_, i) => i !== index));
  };

  // Add blank row helper
  const handleAddRow = () => {
    setExtractedRows([
      ...extractedRows,
      {
        admission_no: `2024${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        father_name: '',
        mother_name: '',
        class_name: '1st',
        village: 'Guruwali',
        phone: '',
        total_annual_fee: 14000,
        concession_amount: 0,
        paid_amount: 0,
      },
    ]);
  };

  // Bulk save to Supabase
  const handleBulkImport = async () => {
    if (extractedRows.length === 0) return;

    setImporting(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extractedRows),
      });

      const data = await res.json();
      if (data.success) {
        setImportSuccess(data.count || extractedRows.length);
        // Refresh local admission list set
        extractedRows.forEach((r) => {
          if (r.admission_no) existingAdmissionNos.add(String(r.admission_no).trim());
        });
      } else {
        alert(data.error || 'Failed to import students');
      }
    } catch (err) {
      alert('Error importing data to Supabase');
    } finally {
      setImporting(false);
    }
  };

  // Helpers to check for confidence / verify highlights
  const isSuspiciousPhone = (phone?: string) => {
    if (!phone) return true;
    const digits = phone.replace(/\D/g, '');
    return digits.length !== 10;
  };

  const isSuspiciousName = (name?: string) => {
    if (!name || name.trim().length < 3) return true;
    return /\d|\?|\!/.test(name);
  };

  const isSuspiciousFee = (fee?: number) => {
    return fee === undefined || fee === null || Number(fee) <= 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full mb-2 border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Gemini Vision Multimodal OCR
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <ScanLine className="w-7 h-7 text-purple-600" />
            AI Rural Register Scanner
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Direct Camera Photo, Confidence Highlighting & Supabase Duplicate Detection
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </div>

      {/* Warning Alert if Gemini Key is demo */}
      {warningMessage && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Notice: </strong>
            {warningMessage}
          </div>
        </div>
      )}

      {/* Import Success Banner */}
      {importSuccess !== null && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>
              Successfully saved <strong>{importSuccess} student records</strong> directly into Supabase!
            </span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 bg-emerald-600 text-white font-bold text-xs px-3.5 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            View in Dashboard
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Upload & Direct Camera Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Upload & Camera Buttons */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              1. Take Photo or Upload Register Page
            </h3>

            {/* Direct Camera Button */}
            <button
              type="button"
              onClick={handleOpenLiveCamera}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Camera className="w-5 h-5" />
              Open Live Camera / Webcam
            </button>

            <div className="flex items-center gap-2 my-2 text-slate-400 text-xs">
              <span className="flex-1 border-t border-slate-200"></span>
              <span>OR CHOOSE FILE</span>
              <span className="flex-1 border-t border-slate-200"></span>
            </div>

            {/* Drag & Browse Zone */}
            <label className="border-2 border-dashed border-slate-300 hover:border-purple-500 bg-slate-50 hover:bg-purple-50/40 transition-all rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer text-center group">
              <UploadCloud className="w-9 h-9 text-slate-400 group-hover:text-purple-600 transition-colors mb-2" />
              <span className="text-xs font-bold text-slate-700">
                Browse register file from device
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                JPG, PNG, or WEBP document photo
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Image Preview & Extract Button */}
            {imagePreview && (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border border-slate-200 max-h-52 bg-slate-100 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Register Preview"
                    className="object-contain max-h-52 w-full"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleStartExtraction}
                  disabled={extracting}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
                >
                  {extracting ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Gemini Vision is scanning handwritten Punjabi/English text...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Run AI Register OCR Extraction
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feature Explainer */}
        <div className="md:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-purple-600" />
              Smart Extraction & Validation Features
            </h3>
            <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <Camera className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Direct Camera Capture:</strong> Click "Open Live Camera" on any mobile phone or laptop to snap the ledger page directly without saving a file first.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span><strong>Confidence Highlighting:</strong> Any row with incomplete phone numbers, missing father names, or zero fees will be highlighted in <span className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-semibold">light yellow</span> for quick manual review.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Duplicate Detection:</strong> Checks Supabase instantly. Existing admission numbers show <span className="bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-semibold">⚠️ Overwrites Existing</span> and new ones show <span className="bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-semibold">✨ New Student</span>.</span>
              </li>
            </ul>
          </div>

          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-[11px] text-purple-800 mt-4">
            💡 <strong>Pro Tip:</strong> Hold the camera parallel to the paper and make sure there are no shadows over the roll number and fee columns.
          </div>
        </div>
      </div>

      {/* Extracted Data Table Preview & Editor */}
      {extractedRows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  2. Review & Edit Extracted Students ({extractedRows.length} rows)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Boxes highlighted in yellow indicate items to double-check before saving to Supabase.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </button>

              <button
                type="button"
                onClick={handleBulkImport}
                disabled={importing}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-md transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {importing ? 'Saving to Database...' : 'Import All to Supabase'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Adm No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Father's Name</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Village</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Total Fee</th>
                  <th className="py-2.5 px-3">Paid Fee</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {extractedRows.map((row, idx) => {
                  const isDuplicate = row.admission_no && existingAdmissionNos.has(String(row.admission_no).trim());
                  const flagPhone = isSuspiciousPhone(row.phone);
                  const flagName = isSuspiciousName(row.name);
                  const flagFee = isSuspiciousFee(row.total_annual_fee);

                  return (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      {/* Status / Duplicate check badge */}
                      <td className="p-2 whitespace-nowrap">
                        {isDuplicate ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full" title="Admission No already exists in Supabase. Importing will update this student.">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Overwrites
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            New
                          </span>
                        )}
                      </td>

                      {/* Adm No */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.admission_no || ''}
                          onChange={(e) => handleCellChange(idx, 'admission_no', e.target.value)}
                          className="w-20 px-2 py-1 border border-slate-200 rounded font-mono font-bold"
                        />
                      </td>

                      {/* Student Name */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.name || ''}
                          onChange={(e) => handleCellChange(idx, 'name', e.target.value)}
                          className={`w-32 px-2 py-1 border rounded font-semibold text-slate-900 ${
                            flagName ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300' : 'border-slate-200'
                          }`}
                          title={flagName ? 'Please verify student name spelling' : ''}
                        />
                      </td>

                      {/* Father Name */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.father_name || ''}
                          onChange={(e) => handleCellChange(idx, 'father_name', e.target.value)}
                          className={`w-28 px-2 py-1 border rounded ${
                            !row.father_name ? 'bg-amber-50 border-amber-300' : 'border-slate-200'
                          }`}
                        />
                      </td>

                      {/* Class */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.class_name || ''}
                          onChange={(e) => handleCellChange(idx, 'class_name', e.target.value)}
                          className="w-16 px-2 py-1 border border-slate-200 rounded font-medium"
                        />
                      </td>

                      {/* Village */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.village || ''}
                          onChange={(e) => handleCellChange(idx, 'village', e.target.value)}
                          className="w-24 px-2 py-1 border border-slate-200 rounded"
                        />
                      </td>

                      {/* Phone */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.phone || ''}
                          onChange={(e) => handleCellChange(idx, 'phone', e.target.value)}
                          className={`w-28 px-2 py-1 border rounded font-mono ${
                            flagPhone ? 'bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-300' : 'border-slate-200'
                          }`}
                          title={flagPhone ? 'Phone should ideally be 10 digits' : ''}
                        />
                      </td>

                      {/* Total Fee */}
                      <td className="p-2">
                        <input
                          type="number"
                          value={row.total_annual_fee ?? 0}
                          onChange={(e) => handleCellChange(idx, 'total_annual_fee', Number(e.target.value))}
                          className={`w-20 px-2 py-1 border rounded font-bold ${
                            flagFee ? 'bg-amber-50 border-amber-300' : 'border-slate-200'
                          }`}
                        />
                      </td>

                      {/* Paid Fee */}
                      <td className="p-2">
                        <input
                          type="number"
                          value={row.paid_amount ?? 0}
                          onChange={(e) => handleCellChange(idx, 'paid_amount', Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-slate-200 rounded font-bold text-emerald-700"
                        />
                      </td>

                      {/* Actions */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Camera Scanner Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            {/* Camera Header */}
            <div className="p-4 flex justify-between items-center border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-400" />
                <h4 className="font-bold text-sm">Live Register Scanner</h4>
              </div>
              <button
                type="button"
                onClick={handleCloseCamera}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewport */}
            <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center text-red-400 text-xs">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  {cameraError}
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Document Align Box Overlay */}
                  <div className="absolute inset-6 border-2 border-dashed border-purple-400/70 rounded-xl pointer-events-none flex items-center justify-center">
                    <span className="text-[11px] text-white/80 bg-black/60 px-3 py-1 rounded-full">
                      Align register sheet inside this frame
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Camera Controls */}
            <div className="p-4 bg-slate-950 flex items-center justify-between">
              <button
                type="button"
                onClick={handleFlipCamera}
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg"
                title="Switch between front and back camera"
              >
                <RotateCcw className="w-4 h-4" />
                Flip
              </button>

              <button
                type="button"
                onClick={handleCapturePhoto}
                disabled={Boolean(cameraError)}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-full shadow-lg shadow-purple-600/50 flex items-center gap-2 disabled:opacity-40"
              >
                <Camera className="w-4 h-4" />
                Snap Photo
              </button>

              <button
                type="button"
                onClick={handleCloseCamera}
                className="text-xs text-slate-400 hover:text-slate-200 px-3 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
