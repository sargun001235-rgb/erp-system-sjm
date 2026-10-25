'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ReceiptIndianRupee, 
  Search, 
  Printer, 
  CheckCircle2, 
  ArrowLeft,
  CreditCard,
  Banknote,
  QrCode,
  UserCheck,
  Share2,
  Scissors,
  Calendar,
  School,
  Check,
  FileText
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

const MONTHS = [
  'April', 'May', 'June', 'July', 'August', 'September', 
  'October', 'November', 'December', 'January', 'February', 'March'
];

const SPECIAL_HEADS = [
  'Admission Fee',
  'Van / Bus Fee',
  'Exam Fee',
  'Annual Charges'
];

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
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedHeads, setSelectedHeads] = useState<string[]>([]);
  const [customRemarks, setCustomRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Receipt Format: thermal (3-inch POS) vs dual-voucher (A4 School + Parent Copy)
  const [receiptFormat, setReceiptFormat] = useState<'thermal' | 'dual-voucher'>('thermal');

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
            const net = Number(found.total_annual_fee || 0) - Number(found.concession_amount || 0);
            const due = Math.max(0, net - Number(found.paid_amount || 0));
            setAmountPaying(due > 0 ? due : '');
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
    setSelectedMonths([]);
    setSelectedHeads([]);
    const net = Number(student.total_annual_fee || 0) - Number(student.concession_amount || 0);
    const due = Math.max(0, net - Number(student.paid_amount || 0));
    setAmountPaying(due > 0 ? due : '');
  };

  const toggleMonth = (m: string) => {
    if (selectedMonths.includes(m)) {
      setSelectedMonths(selectedMonths.filter((x) => x !== m));
    } else {
      setSelectedMonths([...selectedMonths, m]);
    }
  };

  const toggleHead = (h: string) => {
    if (selectedHeads.includes(h)) {
      setSelectedHeads(selectedHeads.filter((x) => x !== h));
    } else {
      setSelectedHeads([...selectedHeads, h]);
    }
  };

  // Compile overall remarks
  const compiledRemarks = [
    selectedMonths.length > 0 ? `Months: ${selectedMonths.join(', ')}` : '',
    selectedHeads.length > 0 ? `Heads: ${selectedHeads.join(', ')}` : '',
    customRemarks.trim(),
  ].filter(Boolean).join(' | ');

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
          fee_remarks: compiledRemarks || 'Tuition Fee Installment',
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

  // WhatsApp Digital Receipt Message Generator
  const getWhatsAppReceiptUrl = () => {
    if (!selectedStudent) return '#';
    const phone = (selectedStudent.phone || '').replace(/\D/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;

    const net = Number(selectedStudent.total_annual_fee || 0) - Number(selectedStudent.concession_amount || 0);
    const remDue = Math.max(0, net - Number(selectedStudent.paid_amount || 0));
    const paidNow = issuedTransaction ? Number(issuedTransaction.amount_paid) : Number(amountPaying || 0);
    const rcptNo = issuedTransaction ? issuedTransaction.receipt_no : 'SJM-FEE';
    const dateStr = issuedTransaction
      ? new Date(issuedTransaction.payment_date).toLocaleDateString('en-IN')
      : new Date().toLocaleDateString('en-IN');

    const msg = encodeURIComponent(
      `🏫 *${SCHOOL_DETAILS.name.toUpperCase()}*\n` +
      `📍 ${SCHOOL_DETAILS.address} (Ph: ${SCHOOL_DETAILS.contact})\n\n` +
      `*OFFICIAL FEE RECEIPT: ${rcptNo}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Student:* ${selectedStudent.name}\n` +
      `🆔 *Adm No:* ${selectedStudent.admission_no}\n` +
      `📚 *Class:* ${selectedStudent.class_name} | *Village:* ${selectedStudent.village || 'Guruwali'}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 *Amount Received:* ₹${paidNow.toLocaleString('en-IN')} (${issuedTransaction?.payment_mode || paymentMode})\n` +
      `📅 *Date:* ${dateStr}\n` +
      `📝 *Months/Heads:* ${issuedTransaction?.fee_remarks || compiledRemarks || 'Tuition Fee'}\n` +
      `💳 *Remaining Balance:* ₹${remDue.toLocaleString('en-IN')}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Note:* Fee once paid is non-refundable. Dhanvaad ji!`
    );

    return `https://wa.me/${cleanPhone}?text=${msg}`;
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
            Fee Collection & Printable Receipts
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Instant fee ledger update, 3-inch POS Thermal Receipt, A4 Dual-Copy Voucher & WhatsApp Share
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/fees/bulk"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-lg shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            Bulk Class Slips (A4)
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Main Grid: Form Left, Receipt Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Search & Payment Form */}
        <div className="lg:col-span-7 space-y-6 no-print">
          {/* Step 1: Search Student */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold">
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
                    Adm #{selectedStudent.admission_no} • Father: {selectedStudent.father_name || 'N/A'} • Village: {selectedStudent.village || 'Guruwali'} • Phone: {selectedStudent.phone || 'N/A'}
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
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-extrabold">
                  2
                </span>
                Enter Payment & Tag Fee Months
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

              {/* Installment Month Tagging Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>📅 Tag Applicable Months (Optional)</span>
                  {selectedMonths.length > 0 && (
                    <span className="text-[11px] text-blue-600 font-semibold">
                      {selectedMonths.length} month(s) selected
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {MONTHS.map((m) => {
                    const isSelected = selectedMonths.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleMonth(m)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{m.slice(0, 3)}</span>
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Fee Head Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  🏷️ Special Fee Heads
                </label>
                <div className="flex flex-wrap gap-2">
                  {SPECIAL_HEADS.map((head) => {
                    const isSelected = selectedHeads.includes(head);
                    return (
                      <button
                        key={head}
                        type="button"
                        onClick={() => toggleHead(head)}
                        className={`py-1 px-2.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{head}</span>
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
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
                  Additional Notes / Cheque / UTR No (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid by Uncle, Cheque #49281, etc."
                  value={customRemarks}
                  onChange={(e) => setCustomRemarks(e.target.value)}
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

        {/* Right Column: Receipt Preview & Dual Modes */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[420px]">
            {/* Top Toolbar: Format Selector & Actions */}
            <div className="flex flex-col gap-2 mb-3 no-print w-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Receipt Format
                </span>

                {/* Format toggle: Thermal vs Dual Voucher */}
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setReceiptFormat('thermal')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      receiptFormat === 'thermal'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    3-Inch POS
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptFormat('dual-voucher')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      receiptFormat === 'dual-voucher'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    A4 Dual Copy (Parent + School)
                  </button>
                </div>
              </div>

              {/* Action Buttons: WhatsApp Share & Print */}
              <div className="flex gap-2 w-full">
                {selectedStudent && (
                  <a
                    href={getWhatsAppReceiptUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-lg shadow-sm transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    WhatsApp Share
                  </a>
                )}

                <button
                  onClick={handlePrint}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg shadow-sm transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
              </div>
            </div>

            {/* Receipt Container: Either 3-inch POS or Dual-Copy Voucher */}
            {receiptFormat === 'thermal' ? (
              /* 3-Inch POS Thermal Receipt */
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

                  {(compiledRemarks || (issuedTransaction && issuedTransaction.fee_remarks)) && (
                    <div className="flex justify-between">
                      <span>Remarks:</span>
                      <span>{issuedTransaction ? issuedTransaction.fee_remarks : compiledRemarks}</span>
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
                    <span>Parent/Guardian</span>
                    <span>Cashier / Principal</span>
                  </div>

                  <p className="text-[9px] text-slate-500 pt-2 border-t border-dotted border-black">
                    Generated by SJM Rural ERP Portal
                  </p>
                </div>
              </div>
            ) : (
              /* Dual-Copy Voucher (Parent Copy + School Copy) */
              <div className="space-y-4 w-full">
                {/* Single voucher template rendered twice */}
                {[
                  { title: 'PARENT COPY (ਮਾਪਿਆਂ ਦੀ ਕਾਪੀ)', bg: 'bg-white' },
                  { title: 'SCHOOL / OFFICE COPY (ਸਕੂਲ ਰਿਕਾਰਡ ਕਾਪੀ)', bg: 'bg-amber-50/40' }
                ].map((copy, idx) => (
                  <div 
                    key={idx}
                    className={`${copy.bg} border-2 border-blue-900 rounded-xl p-4 shadow-sm text-slate-900 text-xs space-y-2.5 relative`}
                  >
                    {idx === 1 && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-[10px] text-slate-400 font-mono flex items-center gap-1 border border-dashed border-slate-300 rounded">
                        <Scissors className="w-3 h-3" /> Cut along dotted line
                      </div>
                    )}

                    <div className="text-center pb-2 border-b border-blue-900/30">
                      <div className="flex items-center justify-center gap-1.5">
                        <School className="w-4 h-4 text-blue-900" />
                        <h4 className="font-extrabold text-blue-900 text-xs uppercase tracking-wide">
                          {SCHOOL_DETAILS.name}
                        </h4>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {SCHOOL_DETAILS.address} • Ph: {SCHOOL_DETAILS.contact}
                      </div>
                      <div className="inline-block mt-1 font-bold text-[9px] uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                        {copy.title}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2 rounded border border-slate-200">
                      <div>
                        <span className="text-slate-500 block text-[9px]">Receipt No</span>
                        <strong className="font-mono">{issuedTransaction?.receipt_no || 'SJM-PREVIEW'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Date</span>
                        <strong>{issuedTransaction ? new Date(issuedTransaction.payment_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Student & Adm No</span>
                        <strong>{selectedStudent ? `${selectedStudent.name} (#${selectedStudent.admission_no})` : '---'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Class & Village</span>
                        <strong>{selectedStudent ? `Class ${selectedStudent.class_name} • ${selectedStudent.village || 'Guruwali'}` : '---'}</strong>
                      </div>
                    </div>

                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase block">Amount Paid</span>
                        <span className="text-[9px] text-emerald-700 italic">
                          {numberToWords(issuedTransaction ? Number(issuedTransaction.amount_paid) : Number(amountPaying || 0))}
                        </span>
                      </div>
                      <span className="text-base font-extrabold text-emerald-700">
                        ₹{issuedTransaction ? Number(issuedTransaction.amount_paid).toLocaleString('en-IN') : (amountPaying ? Number(amountPaying).toLocaleString('en-IN') : '0')}
                      </span>
                    </div>

                    <div className="text-[10px] space-y-0.5 pt-1 border-t border-slate-200">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Mode:</span>
                        <strong>{issuedTransaction?.payment_mode || paymentMode}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Heads/Months:</span>
                        <strong className="text-right truncate max-w-[200px]">
                          {issuedTransaction?.fee_remarks || compiledRemarks || 'General Tuition'}
                        </strong>
                      </div>
                      <div className="flex justify-between font-bold text-red-600 pt-0.5 border-t border-dotted border-slate-300">
                        <span>Balance Due:</span>
                        <span>
                          ₹{Math.max(
                            0,
                            Number(selectedStudent?.total_annual_fee || 0) -
                              Number(selectedStudent?.concession_amount || 0) -
                              Number(selectedStudent?.paid_amount || 0)
                          ).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-between items-center text-[9px] text-slate-500">
                      <span>Cashier / Clerk Signature</span>
                      <span>Principal Signature</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
