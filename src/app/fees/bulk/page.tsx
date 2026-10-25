'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Printer, 
  ArrowLeft, 
  Filter, 
  Scissors, 
  School, 
  Users, 
  IndianRupee, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Student, SCHOOL_DETAILS } from '@/lib/supabase';

const CLASSES = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

export default function BulkClassSlipsPage() {
  const [selectedClass, setSelectedClass] = useState('8th');
  const [defaultersOnly, setDefaultersOnly] = useState(false);
  const [slipTitle, setSlipTitle] = useState('Quarterly Fee Demand Slip');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().slice(0, 10);
  });
  const [slipsPerPage, setSlipsPerPage] = useState<2 | 3>(2);

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClassStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students?class=${selectedClass}${defaultersOnly ? '&defaulters=true' : ''}`);
      const data = await res.json();
      if (data.students) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassStudents();
  }, [selectedClass, defaultersOnly]);

  const handlePrint = () => {
    window.print();
  };

  // Group students into chunks (e.g. 2 per A4 sheet)
  const studentChunks: Student[][] = [];
  for (let i = 0; i < students.length; i += slipsPerPage) {
    studentChunks.push(students.slice(i, i + slipsPerPage));
  }

  // Summary calculations
  const totalClassDue = students.reduce(
    (sum, s) =>
      sum +
      Math.max(
        0,
        Number(s.total_annual_fee || 0) -
          Number(s.concession_amount || 0) -
          Number(s.paid_amount || 0)
      ),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Controls Toolbar (Hidden when printing) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/fees"
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                title="Back to Fee Collection"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Bulk Class Fee Slips (A4 Multi-Print)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Print fee slips of all students of an entire class at once on A4 sheets (2 per page with dotted cut-line)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={students.length === 0}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              Print All Class {selectedClass} Slips ({students.length})
            </button>
          </div>
        </div>

        {/* Configuration Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Class Select */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              {CLASSES.map((c) => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>

          {/* Slip Heading / Title */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Slip Heading / Term</label>
            <input
              type="text"
              value={slipTitle}
              onChange={(e) => setSlipTitle(e.target.value)}
              placeholder="e.g. 2nd Quarter Fee Demand"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Fee Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800"
            />
          </div>

          {/* Filter by due only */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-700 font-semibold hover:bg-slate-100">
              <input
                type="checkbox"
                checked={defaultersOnly}
                onChange={(e) => setDefaultersOnly(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Due Balance Only</span>
            </label>
          </div>
        </div>

        {/* Class Overview Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap justify-between items-center text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span>Class: <strong className="text-slate-900">{selectedClass}</strong></span>
            <span>Total Students: <strong className="text-slate-900">{students.length}</strong></span>
            <span>A4 Sheets Required: <strong className="text-blue-700">{Math.ceil(students.length / slipsPerPage)} sheets</strong></span>
          </div>
          <div>
            <span>Total Class Outstanding: <strong className="text-red-600 font-bold">₹{totalClassDue.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      </div>

      {/* Printable Area: A4 Sheets containing 2 slips each */}
      <div id="bulk-slips-printable" className="space-y-6">
        {loading ? (
          <div className="py-16 text-center text-slate-400 no-print">
            Loading Class {selectedClass} records...
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-slate-500 no-print">
            No students found in Class {selectedClass} matching the criteria.
          </div>
        ) : (
          studentChunks.map((chunk, pageIndex) => (
            <div
              key={pageIndex}
              className="a4-sheet bg-white border border-slate-300 rounded-xl p-4 sm:p-6 shadow-md space-y-4 max-w-4xl mx-auto"
            >
              {chunk.map((student, slipIndex) => {
                const netFee = Number(student.total_annual_fee || 0) - Number(student.concession_amount || 0);
                const paid = Number(student.paid_amount || 0);
                const due = Math.max(0, netFee - paid);

                return (
                  <div key={student.id || student.admission_no} className="avoid-break space-y-3">
                    {/* Fee Slip Card (Half-A4) */}
                    <div className="border-2 border-slate-900 rounded-xl p-4 text-slate-900 text-xs space-y-2.5 bg-white">
                      {/* School Header */}
                      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-lg">
                            SJM
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm sm:text-base tracking-tight uppercase leading-tight text-blue-950">
                              {SCHOOL_DETAILS.name}
                            </h3>
                            <p className="text-[10px] text-slate-600 font-medium">
                              Affiliated to {SCHOOL_DETAILS.board} • {SCHOOL_DETAILS.address}
                            </p>
                            <p className="text-[10px] text-slate-600">
                              Helpline / Office Contact: <strong>{SCHOOL_DETAILS.contact}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-block bg-slate-900 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded uppercase">
                            {slipTitle}
                          </span>
                          <div className="text-[10px] text-slate-600 mt-1">
                            Due Date: <strong className="text-red-700">{new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Student & Parent Info Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-200 p-2 rounded-lg text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Student Name</span>
                          <strong className="text-slate-900">{student.name}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Father's Name</span>
                          <strong>{student.father_name || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Admission No & Class</span>
                          <strong className="font-mono">{student.admission_no} (Class {student.class_name})</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Village / Pind</span>
                          <strong>{student.village || 'Guruwali'}</strong>
                        </div>
                      </div>

                      {/* Fee Breakdown Table */}
                      <div className="border border-slate-300 rounded-lg overflow-hidden text-[11px]">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[10px] uppercase">
                            <tr>
                              <th className="py-1 px-3">Annual Net Fee</th>
                              <th className="py-1 px-3">Fee Paid to Date</th>
                              <th className="py-1 px-3 text-right">Net Outstanding Due (ਬਾਕੀ ਰਕਮ)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="py-1.5 px-3 font-medium">
                                ₹{netFee.toLocaleString('en-IN')}
                                {Number(student.concession_amount) > 0 && (
                                  <span className="text-[9px] text-emerald-600 block">
                                    (-₹{student.concession_amount} concession)
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 px-3 text-emerald-700 font-semibold">
                                ₹{paid.toLocaleString('en-IN')}
                              </td>
                              <td className="py-1.5 px-3 text-right">
                                {due > 0 ? (
                                  <span className="text-base font-extrabold text-red-600">
                                    ₹{due.toLocaleString('en-IN')}
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    ✓ Fully Paid (No Dues)
                                  </span>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Notes & Signatures */}
                      <div className="flex justify-between items-end pt-2 text-[10px] text-slate-600">
                        <div className="italic">
                          * Please submit fees before due date to avoid late fine.<br />
                          UPI / Cash accepted at School Fee Counter.
                        </div>

                        <div className="flex gap-8 text-center pt-3">
                          <div className="border-t border-slate-500 pt-1 px-2 font-medium">
                            Class In-charge
                          </div>
                          <div className="border-t border-slate-500 pt-1 px-2 font-bold text-slate-900">
                            Principal
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dotted Scissor Cut Line (if there is a next slip on the same sheet) */}
                    {slipIndex < chunk.length - 1 && (
                      <div className="relative my-3 flex items-center justify-center">
                        <div className="w-full border-t border-dashed border-slate-400"></div>
                        <span className="absolute bg-white px-3 text-[10px] text-slate-500 font-mono flex items-center gap-1 border border-slate-300 rounded-full">
                          <Scissors className="w-3 h-3" /> Cut along dotted line (ਕੈਂਚੀ ਨਾਲ ਕੱਟੋ)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
