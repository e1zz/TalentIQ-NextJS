export interface Citation {
  documentTitle: string | null;
  citedText: string;
  // 1-indexed, inclusive. Only set for PDF documents.
  startPage?: number;
  endPage?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

export interface ChatRequest {
  messages: Pick<ChatMessage, 'role' | 'content'>[];
}

// Newline-delimited JSON events streamed by POST /api/chat
export type ChatStreamEvent =
  | { type: 'text'; text: string }
  | { type: 'done'; content: string; citations: Citation[] }
  | { type: 'error'; message: string };

export interface ContextFile {
  file_id: string;
  filename: string;
  size_bytes: number;
  created_at: string;
}
