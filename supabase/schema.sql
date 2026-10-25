-- ============================================================
-- SJM School ERP — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── STUDENTS TABLE ──────────────────────────────────────
create table if not exists public.students (
  id                uuid          default uuid_generate_v4() primary key,
  admission_no      text          unique not null,
  name              text          not null,
  father_name       text          default '',
  mother_name       text          default '',
  class_name        text          not null,
  village           text          default '',
  phone             text          default '',
  van_route         text          default '',
  total_annual_fee  numeric(10,2) default 0,
  concession_amount numeric(10,2) default 0,
  paid_amount       numeric(10,2) default 0,
  created_at        timestamptz   default now()
);

-- ─── FEE TRANSACTIONS TABLE ──────────────────────────────
create table if not exists public.fee_transactions (
  id           uuid          default uuid_generate_v4() primary key,
  receipt_no   text          not null unique,
  student_id   uuid          references public.students(id) on delete cascade,
  amount_paid  numeric(10,2) not null,
  payment_mode text          default 'Cash' check (payment_mode in ('Cash','UPI','Bank')),
  fee_remarks  text          default '',
  payment_date timestamptz   default now()
);

-- ─── INDEXES ─────────────────────────────────────────────
create index if not exists idx_students_class  on public.students(class_name);
create index if not exists idx_students_phone  on public.students(phone);
create index if not exists idx_fee_txn_student on public.fee_transactions(student_id);

-- ─── RPC FUNCTION: increment_paid_amount ─────────────────
-- Called from the /api/fees route after inserting a transaction
create or replace function public.increment_paid_amount(
  student_id_param uuid,
  amount_param      numeric
) returns void
language plpgsql
as $$
begin
  update public.students
  set    paid_amount = paid_amount + amount_param
  where  id = student_id_param;
end;
$$;

-- ─── ROW LEVEL SECURITY (optional — enable if needed) ────
-- alter table public.students         enable row level security;
-- alter table public.fee_transactions enable row level security;

-- ─── SAMPLE DATA (remove before production) ──────────────
insert into public.students
  (admission_no, name, father_name, mother_name, class_name, village, phone, total_annual_fee, concession_amount)
values
  ('2024001', 'Gurpreet Singh',   'Harpreet Singh',  'Manpreet Kaur',  '8th',    'Guruwali',       '9814100001', 14000, 0),
  ('2024002', 'Jaspreet Kaur',    'Balvir Singh',    'Sukhwinder Kaur','9th',    'Tarsikka',       '9814100002', 15500, 500),
  ('2024003', 'Manpreet Singh',   'Gurmail Singh',   'Rajwant Kaur',   '10th',   'Lopoke',         '9814100003', 16000, 0),
  ('2024004', 'Navneet Kaur',     'Gurmail Singh',   'Rajwant Kaur',   '8th',    'Lopoke',         '9814100003', 14000, 1000),
  ('2024005', 'Simranjit Singh',  'Avtar Singh',     'Paramjit Kaur',  'Nursery','Amritsar Rural',  '9814100005', 8000, 0)
on conflict (admission_no) do nothing;
