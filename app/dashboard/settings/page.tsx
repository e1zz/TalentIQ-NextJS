'use client';

import FileViewer from '@/components/file-viewer'
import FileUpload from '@/components/fileUpload/fileUpload'
import { Search, Filter, ArrowUpDown } from 'lucide-react'
import PdfFileList from '@/components/dashboard/PdfFileList'
import toast from 'react-hot-toast'

export default function SearchPage() {
  return (
    <div className='min-h-screen p-6 bg-black'>
      {/* Search Header */}
      <div className='mb-6 space-y-4'>
        <div className='flex flex-col gap-4 md:flex-row'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400' />
              <input
                type='text'
                placeholder='Search in files...'
                className='w-full rounded-lg border border-[#242424] bg-[#272727] py-2.5 pl-10 pr-4 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
              />
            </div>
          </div>
          <div className='flex gap-2'>
            <button className='flex items-center gap-2 rounded-lg border border-[#242424] bg-[#272727] px-4 py-2 text-gray-200 transition-colors hover:bg-[#2f2f2f]'>
              <Filter className='h-5 w-5' />
              Filters
            </button>
            <button className='flex items-center gap-2 rounded-lg border border-[#242424] bg-[#272727] px-4 py-2 text-gray-200 transition-colors hover:bg-[#2f2f2f]'>
              <ArrowUpDown className='h-5 w-5' />
              Sort
            </button>
          </div>
        </div>

        {/* Active Filters */}
        <div className='flex flex-wrap gap-2'>
          <FilterTag label='Last 7 days' />
          <FilterTag label='PDF' />
          <FilterTag label='Documentation' />
        </div>
      </div>

      {/* Updated File Viewer and Upload Section */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* File Upload Section */}
        <div className='md:col-span-1 space-y-6'>
          <div className='rounded-lg border border-[#242424] bg-[#272727] p-4'>
            <FileUpload
              onUploadSuccess={() => {
                toast.success('File uploaded successfully!');
                console.log('Upload successful');
              }}
              onUploadError={(error) => {
                console.error('Upload error:', error);
              }}
            />
          </div>
          
          {/* PDF List Section */}
          <div className='rounded-lg border border-[#242424] bg-[#272727] p-4'>
            <PdfFileList />
          </div>
        </div>

        {/* File Viewer Section */}
        <div className='md:col-span-2'>
          <div className='rounded-lg border border-[#242424] bg-[#272727] p-4'>
            <FileViewer />
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterTag({ label }: { label: string }) {
  return (
    <div className='flex items-center gap-1 rounded-full bg-[#2f2f2f] px-3 py-1 text-sm text-gray-200'>
      {label}
      <button className='hover:text-gray-400'>
        <svg
          className='h-4 w-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M6 18L18 6M6 6l12 12'
          />
        </svg>
      </button>
    </div>
  )
}
