import { IngestionPanel } from "./features/ingestion/IngestionPanel"
import { ChatSection } from "./features/chat/ChatSection"


function App() {

  return (
    <div className="container">
      <header className="header">
        <h1>🤖 Assistente Client RAG</h1>
        <p>Interface React para Chat com Documentos e Ingestão Assíncrona</p>
      </header>
      <div className="main-layout">
        <ChatSection />
        <IngestionPanel />
      </div>
    </div>
  )

}

export default App
