'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FileObject } from '@supabase/storage-js';
import { Download, Trash2 } from 'lucide-react';

// Add this helper function at the top of the file, outside the component
const truncateFileName = (fileName: string, maxLength: number = 30) => {
  if (fileName.length <= maxLength) return fileName;
  
  const extension = fileName.slice(fileName.lastIndexOf('.'));
  const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'));
  
  return `${nameWithoutExt.slice(0, maxLength - extension.length - 3)}...${extension}`;
};

export default function PdfFileList() {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();

  const fetchPdfFiles = async () => {
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
      setError(null); // Clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch PDF files');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPdfFiles();

    // Set up real-time subscription for storage changes
    const channel = supabase
      .channel('storage-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'storage',
          table: 'objects'
        },
        () => {
          fetchPdfFiles();
        }
      )
      .subscribe();

    // Refresh every 5 seconds as a fallback
    const intervalId = setInterval(fetchPdfFiles, 5000);

    // Cleanup function
    return () => {
      clearInterval(intervalId);
      channel.unsubscribe();
    };
  }, []);

  const handleDownload = async (file: FileObject) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('candidates')
        .createSignedUrl(file.name, 60); // URL valid for 60 seconds

      if (error) throw error;
      
      // Open the signed URL in a new tab
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
    }
  };

  const handleDelete = async (file: FileObject) => {
    try {
      const { error } = await supabase
        .storage
        .from('candidates')
        .remove([file.name]);

      if (error) throw error;
      
      // Update the files list after successful deletion
      setFiles(files.filter(f => f.id !== file.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span 
                  className="text-gray-200" 
                  title={file.name}
                >
                  {truncateFileName(file.name)}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    {(file.metadata?.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-2 text-gray-200 bg-[#3f3f3f] rounded hover:bg-[#4f4f4f] transition-colors"
                      title="Download file"
                      aria-label="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      className="p-2 text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                      title="Delete file"
                      aria-label="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
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