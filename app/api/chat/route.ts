import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message, threadId } = await req.json();
    
    // Create a new thread if threadId is not provided
    const thread = threadId 
      ? await openai.beta.threads.retrieve(threadId)
      : await openai.beta.threads.create();

    // Add the message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
    });

    // Wait for the completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (runStatus.status !== "completed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      
      if (runStatus.status === "failed") {
        throw new Error("Run failed");
      }
    }

    // Get the messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    return NextResponse.json({
      messages: messages.data,
      threadId: thread.id,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
} 