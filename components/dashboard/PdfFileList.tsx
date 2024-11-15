'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FileObject } from '@supabase/storage-js';

export default function PdfFileList() {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchPdfFiles() {
      try {
        const { data, error } = await supabase
          .storage
          .from('candidates')
          .list();

        if (error) {
          throw error;
        }

        // Filter for PDF files only
        const pdfFiles = data.filter(file => file.name.toLowerCase().endsWith('.pdf'));
        setFiles(pdfFiles);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch PDF files');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPdfFiles();
  }, []);

  if (isLoading) {
    return <div className="text-gray-400">Loading PDF files...</div>;
  }

  if (error) {
    return <div className="text-red-400">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-200">PDF Files</h2>
      {files.length === 0 ? (
        <p className="text-gray-400">No PDF files found</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li 
              key={file.id} 
              className="p-3 border border-[#242424] rounded-lg hover:bg-[#2f2f2f] transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-200">{file.name}</span>
                <span className="text-sm text-gray-400">
                  {(file.metadata?.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 