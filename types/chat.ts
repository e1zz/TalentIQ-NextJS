export interface MessageContent {
  type: 'text';
  text: {
    value: string;
    annotations: any[];
  };
}

export interface Message {
  role: 'user' | 'assistant';
  content: MessageContent[];
}

export interface ChatResponse {
  messages: Message[];
  threadId: string;
} 