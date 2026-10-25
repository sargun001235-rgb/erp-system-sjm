import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const className = searchParams.get('class');
    const village = searchParams.get('village');
    const defaultersOnly = searchParams.get('defaulters') === 'true';

    let query = supabase
      .from('students')
      .select('*')
      .order('name', { ascending: true });

    if (className && className !== 'All') {
      query = query.eq('class_name', className);
    }

    if (village && village !== 'All') {
      query = query.eq('village', village);
    }

    if (search) {
      // Search across name, admission_no, father_name, and phone
      query = query.or(
        `name.ilike.%${search}%,admission_no.ilike.%${search}%,father_name.ilike.%${search}%,phone.ilike.%${search}%,village.ilike.%${search}%`
      );
    }

    const { data: students, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let filtered = students || [];

    if (defaultersOnly) {
      filtered = filtered.filter(
        (s) => Number(s.total_annual_fee || 0) - Number(s.concession_amount || 0) > Number(s.paid_amount || 0)
      );
    }

    return NextResponse.json({ students: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if bulk or single
    if (Array.isArray(body)) {
      const { data, error } = await supabase
        .from('students')
        .upsert(body, { onConflict: 'admission_no' })
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, count: data?.length || 0, students: data });
    }

    const { data, error } = await supabase
      .from('students')
      .insert([body])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, student: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
