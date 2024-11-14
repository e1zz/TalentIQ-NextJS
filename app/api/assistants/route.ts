import { openai } from "@/app/openai";

export const runtime = "nodejs";

// Create a new assistant
export async function POST() {
  const assistant = await openai.beta.assistants.create({
    instructions: "You are a helpful assistant.",
    name: "TalentIQ Assistant",
    model: "gpt-4o",
    tools: [
      { type: "file_search" },
    ],
  });
  return Response.json({ assistantId: assistant.id });
}
