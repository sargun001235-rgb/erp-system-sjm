'use client';

import { useState } from 'react';
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
  ArrowRight
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
      } else {
        alert(data.error || 'Failed to import students');
      }
    } catch (err) {
      alert('Error importing data to Supabase');
    } finally {
      setImporting(false);
    }
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
            Photograph handwritten school register pages to automatically extract student tables into Supabase
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

      {/* Upload & Scanner Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Upload Zone */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              1. Upload or Photograph Register
            </h3>

            <label className="border-2 border-dashed border-slate-300 hover:border-purple-500 bg-slate-50 hover:bg-purple-50/40 transition-all rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer text-center group">
              <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-purple-600 transition-colors mb-2" />
              <span className="text-sm font-bold text-slate-700">
                Click to browse or take camera picture
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Supports JPG, PNG, WEBP photo of handwritten register
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Image Preview */}
            {imagePreview && (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border border-slate-200 max-h-56 bg-slate-100 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Register Preview"
                    className="object-contain max-h-56 w-full"
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
                      Gemini Vision is scanning register text...
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

        {/* Instructions / Features */}
        <div className="md:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-purple-600" />
              How Rural School OCR Works
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <span>Take a clear, well-lit photo of your admission register, roll call sheet, or fee khata.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <span><strong>Gemini 1.5 Flash Vision</strong> recognizes Punjabi & Indian names (e.g. Gurpreet, Simran, Balwinder) and maps columns automatically.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                <span>Review and edit any cell directly in the table below before saving to your official database.</span>
              </li>
            </ul>
          </div>

          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-[11px] text-purple-800 mt-4">
            💡 <strong>Pro Tip:</strong> Even if handwriting is messy, Gemini accurately extracts names and villages like Guruwali, Lopoke, and Tarsikka.
          </div>
        </div>
      </div>

      {/* Extracted Data Table Preview & Editor */}
      {extractedRows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                2. Review & Edit Extracted Students ({extractedRows.length} rows)
              </h3>
              <p className="text-xs text-slate-500">
                You can edit any box below to correct spelling before importing to Supabase.
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
                {extractedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.admission_no || ''}
                        onChange={(e) => handleCellChange(idx, 'admission_no', e.target.value)}
                        className="w-20 px-2 py-1 border border-slate-200 rounded font-mono font-bold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.name || ''}
                        onChange={(e) => handleCellChange(idx, 'name', e.target.value)}
                        className="w-32 px-2 py-1 border border-slate-200 rounded font-semibold text-slate-900"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.father_name || ''}
                        onChange={(e) => handleCellChange(idx, 'father_name', e.target.value)}
                        className="w-28 px-2 py-1 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.class_name || ''}
                        onChange={(e) => handleCellChange(idx, 'class_name', e.target.value)}
                        className="w-16 px-2 py-1 border border-slate-200 rounded font-medium"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.village || ''}
                        onChange={(e) => handleCellChange(idx, 'village', e.target.value)}
                        className="w-24 px-2 py-1 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.phone || ''}
                        onChange={(e) => handleCellChange(idx, 'phone', e.target.value)}
                        className="w-24 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.total_annual_fee ?? 0}
                        onChange={(e) => handleCellChange(idx, 'total_annual_fee', Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-slate-200 rounded font-bold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.paid_amount ?? 0}
                        onChange={(e) => handleCellChange(idx, 'paid_amount', Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-slate-200 rounded font-bold text-emerald-700"
                      />
                    </td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
