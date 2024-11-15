import Chat from "@/components/chat";
import FileViewer from "@/components/file-viewer";

export default function HistoryPage() {
  return (
    <section className='container mx-auto min-h-[calc(100vh-5rem)] flex flex-col px-4 py-4'>
      <div className='flex flex-col lg:flex-row gap-8 flex-1'>
        {/* File Viewer Section */}
        <div className='rounded-lg shadow-md p-6 flex-1'>
          <FileViewer />
        </div>

        {/* Chat Section */}
        <div className='bg-gray-800/50 text-gray-200 rounded-lg px-4 py-2 
                     placeholder-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-blue-500/50 border border-gray-700 flex-1'>
          <Chat />
        </div>
      </div>
    </section>
  )
}
