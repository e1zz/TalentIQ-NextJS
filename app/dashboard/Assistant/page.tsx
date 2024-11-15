import Chat from "@/components/chat";
import FileViewer from "@/components/file-viewer";

export default function HistoryPage() {
  return (
    <section className='px-4 py-6'>
      <div>
        <div className="container">
          <div className="column">
            <h1 className="text-3x1 font-bold">Fileviewer</h1>
            <FileViewer/>
          </div>
        </div>
        <div className="chatcontainer">
          <div className="chat">
            <h1 className='text-3xl font-bold'>Chat</h1>
            <Chat/>
          </div>
        </div>
      </div>
    </section>
  )
}
