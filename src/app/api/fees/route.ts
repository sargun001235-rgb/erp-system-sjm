import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    const { data: transactions, error } = await supabase
      .from('fee_transactions')
      .select(`
        id,
        receipt_no,
        student_id,
        amount_paid,
        payment_mode,
        fee_remarks,
        payment_date,
        students:student_id (
          id,
          admission_no,
          name,
          father_name,
          class_name,
          village,
          phone,
          total_annual_fee,
          concession_amount,
          paid_amount
        )
      `)
      .order('payment_date', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format nested student object cleanly
    const formatted = (transactions || []).map((t: any) => ({
      ...t,
      student: Array.isArray(t.students) ? t.students[0] : t.students,
    }));

    return NextResponse.json({ transactions: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { student_id, amount_paid, payment_mode = 'Cash', fee_remarks = '' } = await request.json();

    if (!student_id || !amount_paid || Number(amount_paid) <= 0) {
      return NextResponse.json(
        { error: 'Valid student_id and positive amount_paid are required.' },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount_paid);

    // Fetch existing student details to calculate new paid_amount
    const { data: student, error: fetchErr } = await supabase
      .from('students')
      .select('*')
      .eq('id', student_id)
      .single();

    if (fetchErr || !student) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    // Generate unique Receipt Number (e.g. SJM-2024-8491)
    const timestampSuffix = Math.floor(1000 + Math.random() * 9000);
    const receipt_no = `SJM-${new Date().getFullYear()}-${timestampSuffix}`;

    // 1. Insert Transaction
    const { data: txn, error: txnError } = await supabase
      .from('fee_transactions')
      .insert([
        {
          receipt_no,
          student_id,
          amount_paid: numericAmount,
          payment_mode,
          fee_remarks,
          payment_date: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (txnError) {
      return NextResponse.json({ error: txnError.message }, { status: 400 });
    }

    // 2. Update Student's paid_amount
    const newPaidAmount = Number(student.paid_amount || 0) + numericAmount;
    const { data: updatedStudent, error: updateErr } = await supabase
      .from('students')
      .update({ paid_amount: newPaidAmount })
      .eq('id', student_id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json(
        { error: 'Transaction recorded, but student total update failed: ' + updateErr.message, transaction: txn },
        { status: 207 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: txn,
      student: updatedStudent,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
