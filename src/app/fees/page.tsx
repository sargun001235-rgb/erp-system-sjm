'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ReceiptIndianRupee, 
  Search, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  UserCheck
} from 'lucide-react';
import { Student, FeeTransaction, SCHOOL_DETAILS } from '@/lib/supabase';
import Link from 'next/link';

// Simple number to Indian words converter for receipt
function numberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero Rupees Only';

  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'Rupees Only' : 'Rupees Only';
  return str.trim();
}

function FeeCollectionContent() {
  const searchParams = useSearchParams();
  const preSelectedStudentId = searchParams.get('student_id');

  const [search, setSearch] = useState('');
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Fee Form
  const [amountPaying, setAmountPaying] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank'>('Cash');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Receipt state after payment
  const [issuedTransaction, setIssuedTransaction] = useState<FeeTransaction | null>(null);

  // Load preselected student if student_id is passed in URL
  useEffect(() => {
    if (preSelectedStudentId) {
      fetch(`/api/students?search=${preSelectedStudentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.students && data.students.length > 0) {
            const found = data.students.find((s: Student) => s.id === preSelectedStudentId) || data.students[0];
            setSelectedStudent(found);
          }
        });
    }
  }, [preSelectedStudentId]);

  // Live search for students
  const handleSearchStudents = async (val: string) => {
    setSearch(val);
    if (!val || val.trim().length < 2) {
      setStudentsList([]);
      return;
    }
    setLoadingSearch(true);
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(val)}`);
      const data = await res.json();
      setStudentsList(data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentsList([]);
    setSearch('');
    setIssuedTransaction(null);
    const net = Number(student.total_annual_fee || 0) - Number(student.concession_amount || 0);
    const due = Math.max(0, net - Number(student.paid_amount || 0));
    setAmountPaying(due > 0 ? due : '');
  };

  const handleSubmitFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !amountPaying || Number(amountPaying) <= 0) {
      alert('Please select a student and enter a valid payment amount.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          amount_paid: Number(amountPaying),
          payment_mode: paymentMode,
          fee_remarks: remarks || 'Monthly/Quarterly installment',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIssuedTransaction(data.transaction);
        if (data.student) {
          setSelectedStudent(data.student);
        }
      } else {
        alert(data.error || 'Failed to record fee');
      }
    } catch (err) {
      alert('Network error while processing fee');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculations for current selected student
  const netFee = selectedStudent
    ? Number(selectedStudent.total_annual_fee || 0) - Number(selectedStudent.concession_amount || 0)
    : 0;
  const alreadyPaid = selectedStudent ? Number(selectedStudent.paid_amount || 0) : 0;
  const currentDue = Math.max(0, netFee - alreadyPaid);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <ReceiptIndianRupee className="w-7 h-7 text-emerald-600" />
            Fee Collection & Thermal Receipt
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Instant fee ledger update with 3-inch POS Thermal Receipt printing
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Main Grid: Form Left, Receipt Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Search & Payment Form */}
        <div className="lg:col-span-7 space-y-6 no-print">
          {/* Step 1: Search Student */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                1
              </span>
              Search & Select Student
            </h3>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Type Admission No, Student Name, Father's Name, or Phone..."
                value={search}
                onChange={(e) => handleSearchStudents(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />

              {/* Autocomplete Dropdown */}
              {studentsList.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {studentsList.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectStudent(s)}
                      className="w-full text-left p-3 hover:bg-blue-50 transition-colors flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                        <div className="text-xs text-slate-500">
                          Adm #{s.admission_no} • S/O {s.father_name} • Class: {s.class_name} • {s.village}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          Due: ₹{(Number(s.total_annual_fee || 0) - Number(s.concession_amount || 0) - Number(s.paid_amount || 0)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Student Banner */}
            {selectedStudent && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-slate-900 text-base">{selectedStudent.name}</h4>
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                      Class {selectedStudent.class_name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Adm #{selectedStudent.admission_no} • Father: {selectedStudent.father_name || 'N/A'} • Village: {selectedStudent.village || 'Guruwali'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Pending Balance</span>
                  <span className="text-lg font-extrabold text-red-600">
                    ₹{currentDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Payment Details */}
          {selectedStudent && (
            <form onSubmit={handleSubmitFee} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                  2
                </span>
                Enter Payment Details
              </h3>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount Paying Now (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Enter amount"
                    value={amountPaying}
                    onChange={(e) => setAmountPaying(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-3 text-lg font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Quick Amount Suggestion Buttons */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentDue > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmountPaying(currentDue)}
                      className="text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-md border border-emerald-200"
                    >
                      Full Due (₹{currentDue.toLocaleString('en-IN')})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAmountPaying(1000)}
                    className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md"
                  >
                    ₹1,000
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaying(2000)}
                    className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md"
                  >
                    ₹2,000
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaying(5000)}
                    className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md"
                  >
                    ₹5,000
                  </button>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Payment Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('Cash')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border font-semibold text-xs transition-all ${
                      paymentMode === 'Cash'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    Cash
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border font-semibold text-xs transition-all ${
                      paymentMode === 'UPI'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    UPI / QR
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('Bank')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border font-semibold text-xs transition-all ${
                      paymentMode === 'Bank'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    Bank Transfer
                  </button>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Receipt Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2nd Installment / Term 1 Fee"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-base transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                {submitting ? (
                  <span>Recording Fee...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Collect ₹{amountPaying ? Number(amountPaying).toLocaleString('en-IN') : '0'} & Generate Receipt
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: 3-Inch POS Thermal Receipt Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[340px]">
            <div className="flex items-center justify-between mb-3 no-print w-full">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                POS Receipt Preview (3-Inch)
              </span>
              {issuedTransaction && (
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
              )}
            </div>

            {/* Thermal Receipt Paper Container */}
            <div
              id="thermal-receipt-printable"
              className="thermal-receipt bg-white border border-slate-300 rounded-lg p-4 shadow-md text-black font-mono text-xs leading-tight w-full"
            >
              {/* Receipt Header */}
              <div className="text-center pb-2 border-b border-dashed border-black">
                <h3 className="text-sm font-extrabold uppercase tracking-tight">
                  {SCHOOL_DETAILS.name}
                </h3>
                <p className="text-[11px] font-bold text-slate-700">
                  {SCHOOL_DETAILS.board}
                </p>
                <p className="text-[10px] text-slate-600">
                  {SCHOOL_DETAILS.address}
                </p>
                <p className="text-[10px] text-slate-600">
                  Ph: {SCHOOL_DETAILS.contact}
                </p>
                <div className="mt-1 pt-1 border-t border-dotted border-black inline-block px-3 font-bold text-[11px]">
                  FEE PAYMENT RECEIPT
                </div>
              </div>

              {/* Receipt Metadata */}
              <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Receipt No:</span>
                  <span className="font-bold">
                    {issuedTransaction ? issuedTransaction.receipt_no : 'SJM-PREVIEW'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>
                    {issuedTransaction
                      ? new Date(issuedTransaction.payment_date).toLocaleDateString('en-IN')
                      : new Date().toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span>
                    {issuedTransaction
                      ? new Date(issuedTransaction.payment_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Student Details */}
              <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Adm No:</span>
                  <span className="font-bold">{selectedStudent ? selectedStudent.admission_no : '---'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Student:</span>
                  <span className="font-bold">{selectedStudent ? selectedStudent.name : 'Select Student'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Father:</span>
                  <span>{selectedStudent ? selectedStudent.father_name : '---'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Class:</span>
                  <span className="font-bold">{selectedStudent ? selectedStudent.class_name : '---'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Village:</span>
                  <span>{selectedStudent ? selectedStudent.village : 'Guruwali'}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="py-2 border-b border-dashed border-black space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-sm font-black pt-1">
                  <span>AMOUNT PAID:</span>
                  <span>
                    ₹{issuedTransaction
                      ? Number(issuedTransaction.amount_paid).toLocaleString('en-IN')
                      : (amountPaying ? Number(amountPaying).toLocaleString('en-IN') : '0.00')}
                  </span>
                </div>

                <div className="text-[10px] italic leading-tight text-slate-800">
                  In Words: {numberToWords(
                    issuedTransaction
                      ? Number(issuedTransaction.amount_paid)
                      : Number(amountPaying || 0)
                  )}
                </div>

                <div className="flex justify-between pt-1">
                  <span>Mode:</span>
                  <span className="font-bold">{issuedTransaction ? issuedTransaction.payment_mode : paymentMode}</span>
                </div>

                {(remarks || (issuedTransaction && issuedTransaction.fee_remarks)) && (
                  <div className="flex justify-between">
                    <span>Remarks:</span>
                    <span>{issuedTransaction ? issuedTransaction.fee_remarks : remarks}</span>
                  </div>
                )}
              </div>

              {/* Balance Summary */}
              {selectedStudent && (
                <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>Total Annual Fee:</span>
                    <span>₹{Number(selectedStudent.total_annual_fee || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {Number(selectedStudent.concession_amount) > 0 && (
                    <div className="flex justify-between">
                      <span>Concession:</span>
                      <span>-₹{Number(selectedStudent.concession_amount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Total Paid So Far:</span>
                    <span>₹{Number(selectedStudent.paid_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-dotted border-black">
                    <span>Remaining Balance:</span>
                    <span>
                      ₹{Math.max(
                        0,
                        Number(selectedStudent.total_annual_fee || 0) -
                          Number(selectedStudent.concession_amount || 0) -
                          Number(selectedStudent.paid_amount || 0)
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              {/* Receipt Footer & Signatures */}
              <div className="pt-4 text-center space-y-3 text-[10px]">
                <p className="italic">
                  * Fee once paid is non-refundable. *<br />
                  Keep this receipt for all future records.
                </p>

                <div className="pt-6 flex justify-between items-center text-[10px]">
                  <span>Student/Parent</span>
                  <span>Cashier / Principal</span>
                </div>

                <p className="text-[9px] text-slate-500 pt-2 border-t border-dotted border-black">
                  Generated by SJM Rural ERP Portal
                </p>
              </div>
            </div>

            {/* Print Button Below Receipt Preview */}
            <div className="mt-4 no-print text-center w-full">
              <button
                onClick={handlePrint}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                Print 3-Inch Thermal Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading fee portal...</div>}>
      <FeeCollectionContent />
    </Suspense>
  );
}
