'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  IndianRupee, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Filter, 
  UserPlus, 
  MessageSquare, 
  ReceiptIndianRupee, 
  ArrowUpRight, 
  MapPin, 
  RefreshCw,
  X,
  Phone
} from 'lucide-react';
import { Student, SCHOOL_DETAILS } from '@/lib/supabase';

const CLASSES = ['All', 'Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedVillage, setSelectedVillage] = useState('All');
  const [defaultersOnly, setDefaultersOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Student form state
  const [newStudent, setNewStudent] = useState({
    admission_no: '',
    name: '',
    father_name: '',
    mother_name: '',
    class_name: '1st',
    village: 'Guruwali',
    phone: '',
    total_annual_fee: 14000,
    concession_amount: 0,
    paid_amount: 0,
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedClass !== 'All') params.append('class', selectedClass);
      if (selectedVillage !== 'All') params.append('village', selectedVillage);
      if (defaultersOnly) params.append('defaulters', 'true');

      const res = await fetch(`/api/students?${params.toString()}`);
      const data = await res.json();
      if (data.students) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, selectedVillage, defaultersOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  // Distinct villages from current students
  const villages = ['All', ...Array.from(new Set(students.map((s) => s.village).filter(Boolean)))];

  // Financial calculations
  const totalStudents = students.length;
  const totalExpectedFee = students.reduce(
    (sum, s) => sum + (Number(s.total_annual_fee || 0) - Number(s.concession_amount || 0)),
    0
  );
  const totalCollectedFee = students.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0);
  const totalPendingFee = Math.max(0, totalExpectedFee - totalCollectedFee);
  const totalDefaulters = students.filter(
    (s) => Number(s.total_annual_fee || 0) - Number(s.concession_amount || 0) > Number(s.paid_amount || 0)
  ).length;

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewStudent({
          admission_no: '',
          name: '',
          father_name: '',
          mother_name: '',
          class_name: '1st',
          village: 'Guruwali',
          phone: '',
          total_annual_fee: 14000,
          concession_amount: 0,
          paid_amount: 0,
        });
        fetchStudents();
      } else {
        alert(data.error || 'Failed to add student');
      }
    } catch (err) {
      alert('Error creating student');
    }
  };

  const getWhatsAppReminderUrl = (student: Student, dueAmount: number) => {
    const phone = (student.phone || '').replace(/\D/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const msg = encodeURIComponent(
      `Sat Sri Akal ji, ${SCHOOL_DETAILS.name} (Guruwali, Amritsar) walon suchna: ` +
      `${student.name} (Class: ${student.class_name}, Adm: ${student.admission_no}) di pending school fee Rs. ${dueAmount.toLocaleString('en-IN')} hai. ` +
      `Kripya jaldi jma karwao ji. Helpline: ${SCHOOL_DETAILS.contact}`
    );
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="inline-block bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            {SCHOOL_DETAILS.board} • School ERP
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {SCHOOL_DETAILS.name}
          </h2>
          <p className="text-slate-300 text-sm mt-1 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-400" />
            {SCHOOL_DETAILS.address} • Ph: {SCHOOL_DETAILS.contact}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>

          <Link
            href="/fees"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
          >
            <ReceiptIndianRupee className="w-4 h-4" />
            Fee Collection
          </Link>

          <Link
            href="/scan"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02]"
          >
            <ArrowUpRight className="w-4 h-4" />
            Scan Register
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalStudents}</h3>
            <p className="text-xs text-slate-400 mt-1">Students across all classes</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Expected Fee */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Expected Fee</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">₹{totalExpectedFee.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-slate-400 mt-1">Annual net curriculum fees</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Collected Fee */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Collected</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">₹{totalCollectedFee.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-emerald-600/80 mt-1">
              {totalExpectedFee > 0 ? `${Math.round((totalCollectedFee / totalExpectedFee) * 100)}% of total target` : 'No data'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Defaulter / Pending Fee */}
        <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Outstanding Dues</p>
            <h3 className="text-2xl font-bold text-red-700 mt-1">₹{totalPendingFee.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-red-500 mt-1 font-medium">{totalDefaulters} students pending</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, admission no, father's name, village, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-blue-700"
            >
              Search
            </button>
          </form>

          {/* Quick Refresh */}
          <button
            onClick={fetchStudents}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-sm">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-600 text-xs uppercase">Filters:</span>
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500">Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Village Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500">Village/Pind:</label>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {villages.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Defaulters toggle */}
          <label className="inline-flex items-center gap-2 cursor-pointer ml-auto bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 transition-colors text-xs font-semibold">
            <input
              type="checkbox"
              checked={defaultersOnly}
              onChange={(e) => setDefaultersOnly(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-500"
            />
            Show Defaulters Only (Due Fees)
          </label>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Adm. No</th>
                <th className="py-3 px-4">Student & Parents</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Village</th>
                <th className="py-3 px-4">Total Fee</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Balance Due</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading student records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-base">No student records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Did you run the schema in Supabase? Or click "Add Student" / "Scan Register" to create records.
                    </p>
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const netFee = Number(student.total_annual_fee || 0) - Number(student.concession_amount || 0);
                  const paid = Number(student.paid_amount || 0);
                  const due = Math.max(0, netFee - paid);
                  const isPaidInFull = due === 0;

                  return (
                    <tr key={student.id || student.admission_no} className="hover:bg-slate-50/80 transition-colors">
                      {/* Adm No */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {student.admission_no}
                      </td>

                      {/* Name & Parents */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="text-xs text-slate-500">
                          S/D/O {student.father_name || 'N/A'}
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-md">
                          {student.class_name}
                        </span>
                      </td>

                      {/* Village */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {student.village || 'Guruwali'}
                      </td>

                      {/* Total Net Fee */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        ₹{netFee.toLocaleString('en-IN')}
                        {Number(student.concession_amount) > 0 && (
                          <span className="block text-[10px] text-emerald-600 font-normal">
                            (-₹{student.concession_amount} concession)
                          </span>
                        )}
                      </td>

                      {/* Paid */}
                      <td className="py-3.5 px-4 font-semibold text-emerald-700">
                        ₹{paid.toLocaleString('en-IN')}
                      </td>

                      {/* Due */}
                      <td className="py-3.5 px-4">
                        {isPaidInFull ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Cleared
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                            ₹{due.toLocaleString('en-IN')} Due
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Collect Fee Link */}
                          <Link
                            href={`/fees?student_id=${student.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                          >
                            <ReceiptIndianRupee className="w-3.5 h-3.5" />
                            Pay Fee
                          </Link>

                          {/* WhatsApp Reminder (if due) */}
                          {due > 0 && student.phone && (
                            <a
                              href={getWhatsAppReminderUrl(student, due)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                              title="Send WhatsApp Due Reminder"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add New Student</h3>
                <p className="text-xs text-slate-500">SJM Senior Secondary School Record</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admission No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2024006"
                    value={newStudent.admission_no}
                    onChange={(e) => setNewStudent({ ...newStudent, admission_no: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class *</label>
                  <select
                    value={newStudent.class_name}
                    onChange={(e) => setNewStudent({ ...newStudent, class_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {CLASSES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Harmanpreet Singh"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Father's Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Balwinder Singh"
                    value={newStudent.father_name}
                    onChange={(e) => setNewStudent({ ...newStudent, father_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mother's Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Gurmit Kaur"
                    value={newStudent.mother_name}
                    onChange={(e) => setNewStudent({ ...newStudent, mother_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Village / Pind</label>
                  <input
                    type="text"
                    placeholder="e.g. Guruwali"
                    value={newStudent.village}
                    onChange={(e) => setNewStudent({ ...newStudent, village: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9814100000"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Annual Fee (₹)</label>
                  <input
                    type="number"
                    value={newStudent.total_annual_fee}
                    onChange={(e) => setNewStudent({ ...newStudent, total_annual_fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Concession Discount (₹)</label>
                  <input
                    type="number"
                    value={newStudent.concession_amount}
                    onChange={(e) => setNewStudent({ ...newStudent, concession_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md"
                >
                  Save Student Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
