import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export interface Student {
  id: string;
  admission_no: string;
  name: string;
  father_name: string;
  mother_name: string;
  class_name: string;
  village: string;
  phone: string;
  van_route: string;
  total_annual_fee: number;
  concession_amount: number;
  paid_amount: number;
  created_at?: string;
}

export interface FeeTransaction {
  id: string;
  receipt_no: string;
  student_id: string;
  amount_paid: number;
  payment_mode: 'Cash' | 'UPI' | 'Bank';
  fee_remarks: string;
  payment_date: string;
  student?: Student;
}

export const SCHOOL_DETAILS = {
  name: 'SJM Senior Secondary School',
  board: 'PSEB (Punjab School Education Board)',
  address: 'Guruwali, Tarn Taran Road, Amritsar',
  contact: '9814868114',
  tagline: 'Excellence in Rural Education & Holistic Development'
};
