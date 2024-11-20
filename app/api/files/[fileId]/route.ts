import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 300;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    const files = await openai.files.list({
      purpose: 'assistants'
    });

    return NextResponse.json(files.data);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files. Please try again.' },
      { status: 500 }
    );
  }
}
