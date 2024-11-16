import { assistantId } from "@/app/assistant-config";
import { openai } from "@/app/openai";
import { NextRequest } from 'next/server';



// upload file to assistant's vector store
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const vectorStoreId = await getOrCreateVectorStore();

  const openaiFile = await openai.files.create({
    file: file as File,
    purpose: "assistants",
  });

  await openai.beta.vectorStores.files.create(vectorStoreId, {
    file_id: openaiFile.id,
  });
  return Response.json({ success: true });
}

// list files in assistant's vector store
export async function GET() {
  const vectorStoreId = await getOrCreateVectorStore();
  const fileList = await openai.beta.vectorStores.files.list(vectorStoreId);

  const filesArray = await Promise.all(
    fileList.data.map(async (file) => {
      const fileDetails = await openai.files.retrieve(file.id);
      const vectorFileDetails = await openai.beta.vectorStores.files.retrieve(
        vectorStoreId,
        file.id
      );
      return {
        file_id: file.id,
        filename: fileDetails.filename,
        status: vectorFileDetails.status,
      };
    })
  );
  return Response.json(filesArray);
}

// delete file from assistant's vector store
export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const fileId = body.fileId;

  const vectorStoreId = await getOrCreateVectorStore();
  await openai.beta.vectorStores.files.del(vectorStoreId, fileId);

  return Response.json({ success: true });
}
/* Helper functions */

const getOrCreateVectorStore = async () => {
  const assistant = await openai.beta.assistants.retrieve(assistantId);

  // if the assistant already has a vector store, return it
  if (assistant.tool_resources!.file_search!.vector_store_ids!.length > 0) {
    return assistant.tool_resources!.file_search!.vector_store_ids![0];
  }
  // otherwise, create a new vector store and attatch it to the assistant
  const vectorStore = await openai.beta.vectorStores.create({
    name: "assistant-vector-store",
  });
  await openai.beta.assistants.update(assistantId, {
    tool_resources: {
      file_search: {
        vector_store_ids: [vectorStore.id],
      },
    },
  });
  return vectorStore.id;
};
