'use client';

import { useState } from 'react';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Download, Trash2 } from 'lucide-react';

// Add this helper function at the top of the file, outside the component
const truncateFileName = (fileName: string, maxLength: number = 30) => {
  if (fileName.length <= maxLength) return fileName;
  
  const extension = fileName.slice(fileName.lastIndexOf('.'));
  const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'));
  
  return `${nameWithoutExt.slice(0, maxLength - extension.length - 3)}...${extension}`;
};

export default function PdfFileList() {
  const convex = useConvex();
  const documents = useQuery(api.documents.list, { folder: 'Candidate CVs' });
  const removeDocument = useMutation(api.documents.remove);
  const [error, setError] = useState<string | null>(null);

  // useQuery is reactive, so uploads and deletes show up without polling
  const isLoading = documents === undefined;
  const files = (documents ?? []).filter(doc => doc.contentType === 'application/pdf');

  const handleDownload = async (documentId: Id<'documents'>) => {
    try {
      const url = await convex.query(api.documents.getDownloadUrl, { documentId });
      if (!url) throw new Error('This document has no file');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
    }
  };

  const handleDelete = async (documentId: Id<'documents'>) => {
    try {
      await removeDocument({ documentId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  if (isLoading) {
    return <div className="text-gray-400" role="status">Loading PDF files...</div>;
  }

  if (error) {
    return <div className="text-red-400" role="alert">Error: {error}</div>;
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
              key={file._id} 
              className="p-3 border border-[#242424] rounded-lg hover:bg-[#2f2f2f] transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span 
                  className="text-gray-200" 
                  title={file.fileName ?? file.title}
                >
                  {truncateFileName(file.fileName ?? file.title)}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    {((file.size ?? 0) / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(file._id)}
                      className="p-2 text-gray-200 bg-[#3f3f3f] rounded hover:bg-[#4f4f4f] transition-colors"
                      title="Download file"
                      aria-label="Download file"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDelete(file._id)}
                      className="p-2 text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                      title="Delete file"
                      aria-label="Delete file"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 