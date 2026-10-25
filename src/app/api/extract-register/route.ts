import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image base64 data is required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';

    // If key is missing or obviously invalid (like the AQ. token), provide informative message with mock fallback option
    if (!apiKey || apiKey.startsWith('AQ.')) {
      return NextResponse.json({
        warning: 'Gemini API key is invalid or pending (starts with AQ. instead of AIzaSy). Showing demo extracted register data.',
        students: [
          {
            admission_no: '2024101',
            name: 'Harmanpreet Kaur',
            father_name: 'Sarabjit Singh',
            mother_name: 'Paramjit Kaur',
            class_name: '10th',
            village: 'Guruwali',
            phone: '9814234567',
            total_annual_fee: 16000,
            concession_amount: 0,
            paid_amount: 8000,
          },
          {
            admission_no: '2024102',
            name: 'Amritpal Singh',
            father_name: 'Kulwant Singh',
            mother_name: 'Harjinder Kaur',
            class_name: '9th',
            village: 'Tarsikka',
            phone: '9872145678',
            total_annual_fee: 15500,
            concession_amount: 500,
            paid_amount: 15000,
          },
          {
            admission_no: '2024103',
            name: 'Kawaljit Kaur',
            father_name: 'Satnam Singh',
            mother_name: 'Kirandeep Kaur',
            class_name: '8th',
            village: 'Lopoke',
            phone: '9814987654',
            total_annual_fee: 14000,
            concession_amount: 0,
            paid_amount: 6000,
          },
          {
            admission_no: '2024104',
            name: 'Gurwinder Singh',
            father_name: 'Dilbag Singh',
            mother_name: 'Baljit Kaur',
            class_name: '6th',
            village: 'Chabba',
            phone: '9417234567',
            total_annual_fee: 12000,
            concession_amount: 0,
            paid_amount: 12000,
          },
        ],
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Clean base64 string if it contains data prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `
You are an expert AI data extractor for rural Indian schools in Punjab (PSEB affiliated).
Examine this photo of a handwritten or printed student admission/fee register.

Extract all student entries into a clean JSON array of objects.
Each object must have the following keys:
- "admission_no": string (if not legible, generate a reasonable sequential ID like 2024010)
- "name": string (Student name, e.g. Gurpreet Singh, Simran Kaur)
- "father_name": string (Father's name)
- "mother_name": string (Mother's name, empty string if missing)
- "class_name": string (e.g., "Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th")
- "village": string (Village/Pind, e.g., Guruwali, Tarn Taran, Lopoke, Tarsikka, Chabba, Amritsar)
- "phone": string (10-digit Indian phone number if available, else empty string)
- "total_annual_fee": number (annual fee amount, default 14000 if not specified)
- "concession_amount": number (concession or scholarship discount, default 0)
- "paid_amount": number (fee already paid, default 0)

Return ONLY a valid JSON array of objects with no markdown fences, no explanatory text.
Example format:
[
  {
    "admission_no": "2024010",
    "name": "Manjot Singh",
    "father_name": "Kashmir Singh",
    "mother_name": "Sukhwinder Kaur",
    "class_name": "8th",
    "village": "Guruwali",
    "phone": "9814123456",
    "total_annual_fee": 14000,
    "concession_amount": 0,
    "paid_amount": 7000
  }
]
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      },
    ]);

    const responseText = result.response.text().trim();

    // Strip markdown code fences if Gemini added them
    const jsonString = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const students = JSON.parse(jsonString);

    return NextResponse.json({ success: true, students });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'AI Extraction failed: ' + (err.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
