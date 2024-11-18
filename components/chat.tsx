'use client';

import { useState } from 'react';
import { RiRobot2Fill } from "react-icons/ri";
import { pdf } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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

const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
  },
  message: {
    marginBottom: 10,
    padding: 10,
  },
  userMessage: {
    backgroundColor: '#E6E6FA',
  },
  assistantMessage: {
    backgroundColor: '#F0F8FF',
  },
});

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
        return item.text.value;
      }
      return '';
    }).join(' ');
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

  const downloadPDF = async () => {
    const MyDocument = () => (
      <Document>
        <Page size="A4" style={pdfStyles.page}>
          {messages.map((message, index) => (
            <View
              key={index}
              style={[
                pdfStyles.message,
                message.role === 'user'
                  ? pdfStyles.userMessage
                  : pdfStyles.assistantMessage,
              ]}
            >
              <Text>
                {`${message.role.toUpperCase()}: ${renderMessageContent(message.content)}`}
              </Text>
            </View>
          ))}
        </Page>
      </Document>
    );

    const blob = await pdf(<MyDocument />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chat-history.pdf';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 h-screen flex flex-col">
      <div className="flex justify-end mb-4">
        <button
          onClick={downloadPDF}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Download Chat
        </button>
      </div>
      
      <div className="space-y-4 mb-4 overflow-y-auto flex-1 
        scrollbar-thin 
        scrollbar-thumb-blue-500 
        scrollbar-track-gray-200 
        hover:scrollbar-thumb-blue-700
        dark:scrollbar-thumb-blue-600 
        dark:scrollbar-track-gray-800
        dark:hover:scrollbar-thumb-blue-400
        scrollbar-thumb-rounded-full
        scrollbar-track-rounded-full
        pr-2"
      >
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