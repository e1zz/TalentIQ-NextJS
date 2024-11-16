'use client';

import { useState } from 'react';
import { RiRobot2Fill } from "react-icons/ri";

interface MessageContent {
  type: 'text';
  text: {
    value: string;
    annotations: any[];
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: MessageContent[];
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);

  const renderMessageContent = (content: MessageContent[] | string) => {
    if (typeof content === 'string') {
      return content;
    }
    return content.map((item, index) => {
      if (item.type === 'text') {
        return <div key={index}>{item.text.value}</div>;
      }
      return null;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { 
      role: 'user', 
      content: [{ 
        type: 'text', 
        text: { 
          value: input,
          annotations: [] 
        } 
      }] 
    }]);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          threadId: threadId,
        }),
      });

      const data = await response.json();
      setThreadId(data.threadId);
      setMessages(data.messages);
      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="space-y-4 mb-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex items-start gap-2 ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <RiRobot2Fill className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <article
              className={`p-4 rounded-lg shadow-sm max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">
                {renderMessageContent(message.content)}
              </div>
            </article>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder="Type your message..."
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
} 