'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';

interface FileUploadProps {
  onUploadSuccess?: () => void;
  onUploadError?: (error: string) => void;
  bucketName?: string;
  selectedLabels?: string[];
}

const FileUpload = ({ 
  onUploadSuccess, 
  onUploadError,
  bucketName = 'candidates',
  selectedLabels = []
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const supabase = createClientComponentClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB', {
        style: {
          border: '1px solid #713200',
          padding: '16px',
          color: '#713200',
        },
        iconTheme: {
          primary: '#713200',
          secondary: '#FFFAEE',
        },
      });
      onUploadError?.('File size must be less than 10MB');
      return;
    }

    if (!file.type.includes('pdf')) {
      toast.error('Only PDF files are allowed', {
        style: {
          border: '1px solid #713200',
          padding: '16px',
          color: '#713200',
        },
        iconTheme: {
          primary: '#713200',
          secondary: '#FFFAEE',
        },
      });
      onUploadError?.('Only PDF files are allowed');
      return;
    }

    const uploadPromise = new Promise(async (resolve, reject) => {
      try {
        setUploading(true);
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(`${Date.now()}-${file.name}`, file, {
            metadata: {
              labels: selectedLabels.join(',')
            }
          });

        if (error) throw error;

        onUploadSuccess?.();
        resolve('File uploaded successfully!');
      } catch (error: any) {
        console.error('Error uploading file:', error);
        onUploadError?.(error.message);
        reject(error.message);
      } finally {
        setUploading(false);
      }
    });

    toast.promise(
      uploadPromise,
      {
        loading: 'Uploading...',
        success: 'File uploaded successfully!',
        error: (err) => `Upload failed: ${err}`,
      },
      {
        style: {
          minWidth: '250px',
          border: '1px solid',
          padding: '16px',
        },
        success: {
          style: {
            border: '1px solid rgb(34 197 94)',
            color: 'rgb(34 197 94)',
          },
          iconTheme: {
            primary: 'rgb(34 197 94)',
            secondary: '#FFFAEE',
          },
        },
        error: {
          style: {
            border: '1px solid #713200',
            color: '#713200',
          },
          iconTheme: {
            primary: '#713200',
            secondary: '#FFFAEE',
          },
        },
      }
    );
  };

  return (
    <div className="mb-6">
      <label className="block w-full p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-blue-500/50 transition-colors cursor-pointer">
        <div className="flex flex-col items-center justify-center">
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <span className="text-gray-400">
            {uploading ? 'Uploading...' : 'Click to upload PDF (max 10MB)'}
          </span>
        </div>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  );
};

export default FileUpload;
