import { openai } from "@/app/openai";
import { NextRequest } from "next/server"; 
// Send a new message to a thread
export async function POST(request: NextRequest) {
  const data = await request.json();
  const { toolCallOutputs, runId } = data;
  const stream = openai.beta.threads.runs.submitToolOutputsStream(
    request.nextUrl.pathname.split('/')[4], // Get threadId from URL path
    runId,
    // { tool_outputs: [{ output: result, tool_call_id: toolCallId }] },
    { tool_outputs: toolCallOutputs }
  );

  return new Response(stream.toReadableStream());
}
