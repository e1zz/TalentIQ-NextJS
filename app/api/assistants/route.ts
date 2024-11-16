import OpenAI from 'openai';
import { NextRequest } from 'next/server';

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const assistant = await openai.beta.assistants.create({
      instructions: "You are TalentIQ, an AI assistant specialized in helping users with their career development, job search, and professional growth. You provide personalized advice, resume reviews, interview preparation, and career guidance. You are knowledgeable about various industries, job markets, and professional development strategies.",
      name: "TalentIQ Assistant",
      model: "gpt-4-turbo-preview",
      tools: [
        { type: "code_interpreter" },
        { type: "file_search" },
      ],
    });

    return Response.json({ assistant });
  } catch (error) {
    return Response.json({ error: "Failed to create assistant" }, { status: 500 });
  }
}

// Optionally add a GET endpoint to retrieve the assistant
export async function GET() {
  try {
    const assistants = await openai.beta.assistants.list();
    return Response.json(assistants);
  } catch (error) {
    console.error('Error listing assistants:', error);
    return Response.json(
      { error: 'Failed to list assistants' },
      { status: 500 }
    );
  }
}
