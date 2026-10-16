'use client';

import { useState } from 'react';
import Markdown from 'react-markdown';
import { Sparkles, FileText } from 'lucide-react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ChatMessage, ChatStreamEvent, Citation } from '@/types/chat';

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

function citationLabel(citation: Citation) {
  const title = citation.documentTitle ?? 'Document';
  if (citation.startPage === undefined) return title;
  return citation.startPage === citation.endPage
    ? `${title} p.${citation.startPage}`
    : `${title} pp.${citation.startPage}-${citation.endPage}`;
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const updateLastMessage = (update: (message: ChatMessage) => ChatMessage) =>
    setMessages(prev => [...prev.slice(0, -1), update(prev[prev.length - 1])]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const history: ChatMessage[] = [...messages, { role: 'user', content: input }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!response.ok || !response.body) {
        const { error } = await response.json().catch(() => ({ error: null }));
        throw new Error(error ?? `Request failed (${response.status})`);
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as ChatStreamEvent;
          if (event.type === 'text') {
            updateLastMessage(m => ({ ...m, content: m.content + event.text }));
          } else if (event.type === 'done') {
            updateLastMessage(m => ({ ...m, content: event.content, citations: event.citations }));
          } else {
            throw new Error(event.message);
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      updateLastMessage(m => ({ ...m, content: `⚠️ ${message}` }));
    } finally {
      setIsLoading(false);
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
              <Text>{`${message.role.toUpperCase()}: ${message.content}`}</Text>
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
    <div className="max-w-2xl mx-auto p-4 h-[730px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-2 rounded-full border border-gray-700 px-3 py-1 text-xs font-semibold text-gray-300">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          Claude Opus 5.5
        </span>
        <button
          onClick={downloadPDF}
          disabled={messages.length === 0}
          className="px-4 py-2 bg-green-500 text-white rounded-sm disabled:opacity-50"
        >
          Download Chat
        </button>
      </div>

      <div className="space-y-4 mb-4 overflow-y-auto flex-1 flex flex-col-reverse
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
        <div className="flex flex-col gap-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex items-start gap-2 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 shrink-0 rounded-full bg-linear-to-br from-blue-500 to-emerald-300 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <article
                className={`p-4 rounded-lg shadow-xs max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                {message.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                ) : message.content ? (
                  <div className="space-y-2 [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc [&_table]:text-sm [&_td]:border [&_td]:px-2 [&_th]:border [&_th]:px-2">
                    <Markdown>{message.content}</Markdown>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-300 pt-2 text-xs">
                    <span className="font-semibold text-gray-600">Sources:</span>
                    {message.citations.map((citation, i) => (
                      <span
                        key={i}
                        title={citation.citedText}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-blue-700"
                      >
                        <FileText className="h-3 w-3" />
                        {citationLabel(citation)}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border rounded-sm"
          placeholder="Ask about candidates, roles or reports..."
          disabled={isLoading}
        />
        <button
          type="submit"
          className={`px-4 py-2 bg-blue-500 text-white rounded-sm ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
}
