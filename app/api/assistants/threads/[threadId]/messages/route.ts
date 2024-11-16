import { assistantId } from "@/app/assistant-config";
import { openai } from "@/app/openai";
import { NextRequest } from 'next/server';


export const runtime = "nodejs";

type Message = {
  role: "user" | "assistant" | "code";
  text: string;
};

// Send a new message to a thread
export async function POST(
  request: NextRequest,
  params: any
) {
  const { content } = await request.json();

  const threadId = (await params).threadId

  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content,
  });

  const stream = openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId,
  });

  return new Response(stream.toReadableStream());
}
