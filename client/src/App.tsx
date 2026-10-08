
import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import type { ChatResponse, IngestResponse, JobStatusResponse, ChatMessage, } from './types/api'
import { generateId } from './utils/uuid'

const BASE_ENV = import.meta.env.BASE_URL
const API_BASE_URL = (BASE_ENV && BASE_ENV !== '/') ? BASE_ENV : 'http://localhost:3000'


function App() {
  // --- Estados do Chat --- 
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState<string>('')
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // --- Estados do Upload e Jobs ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const [trackedJobs, setTrackedJobs] = useState<JobStatusResponse[]>([])

  // Rolagem automática do chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isChatLoading])

  // Polling automático para atualizar o status dos Jobs pendentes/em processamento
  useEffect(() => {
    const activeJobs = trackedJobs.filter((j) => j.status.toString() === 'PENDING' || j.status.toString() === 'PROCESSING')

    if (activeJobs.length === 0) return

    const interval = setInterval(() => {
      activeJobs.forEach(async (job) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/ingest/status/${job.jobId}`)
          if (res.ok) {
            const data: JobStatusResponse = await res.json()
            setTrackedJobs((prev) => {
              return prev.map((item) => (item.jobId === data.jobId ? data : item))
            })
          }
        } catch (error) {
          console.error('Erro ao consulta o status do job', error)
        }
      })
    }, 3000)

    return () => clearInterval(interval)

  }, [trackedJobs])

  // --- Handlers do Chat ---
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || isChatLoading) return

    const userMsg: ChatMessage = {
      id: generateId(),
      sender: 'user',
      text: question.trim(),
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMsg])
    const currentQuestion = question
    setQuestion('')
    setIsChatLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQuestion })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao processar pergunta')
      }

      const data: ChatResponse = await response.json()

      const assistantMsg: ChatMessage = {
        id: generateId(),
        sender: 'assistant',
        text: data.answer,
        sources: data.sources,
        timestamp: new Date()
      }

      setMessages((prev) => [...prev, assistantMsg])

    } catch (err) {
      const errorMsg: ChatMessage = {
        id: generateId(),
        sender: 'assistant',
        text: `Error: ${err} || Falha na comunicação com a API.`,
        timestamp: new Date()
      }

      setMessages((prev) => [...prev, errorMsg])
      console.error('', errorMsg)
    }
    finally {
      setIsChatLoading(false)
    }
  }


  // --- Handlers de Upload de Arquivos ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setUploadMessage(null)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || isUploading) return

    setIsUploading(true)
    setUploadMessage('')

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch(`${API_BASE_URL}/api/ingest`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error ao enviar arquivo.')
      }

      const data: IngestResponse = await response.json()

      setUploadMessage(`Arquivo enfileirado! ID do Job: ${data.jobId}`)
      setSelectedFile(null)

      setTrackedJobs((prev) => [
        {
          jobId: data.jobId,
          fileName: selectedFile.name,
          status: 'PENDING',
          errorMessage: null,
          updatedAt: new Date().toISOString(),
        }, ...prev,])
    } catch (error) {
      setUploadMessage(`Error: ${error}`)
    }
    finally {
      setIsUploading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPRETED':
        return <span className='badge badge-success'>Concluído</span>
      case 'PROCESSING':
        return <span>Processando...</span>
      case 'FAILED':
        return <span>Falhou</span>
      default:
        return <span>Pendente</span>
    }
  }

  return (
    <div className='container'>
      <header className='header'>
        <h1>🤖 Assistent Client RAG</h1>
        <p>Interface React para Chat com Documentos e Ingestão Assíncrona</p>
      </header>
      <div className="main-layout">
        {/* Lado Esquerdo: Chat RAG */}
        <section className="card chat-section">
          <h2>💬 Chat RAG</h2>
          <div className="chat-window">
            {messages.length === 0 ? (
              <div className="empty-chat">
                Envie uma pergunta para consultar a base de conhecimento
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`message-bubble ${msg.sender}`}>
                  <div className="message-text">{msg.text}</div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="sources-box">
                      <strong>Fontes consultadas:</strong>
                      <ul>
                        {msg.sources.map((src, idx) => (
                          < li key={idx}>{src}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="message-bubble assistant loading">
                <span>Analisando contexto e gerando resposta...</span>
              </div>

            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="chat-form">
            <input
              type='text'
              placeholder='Digite sua pergunta'
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isChatLoading}
            />
            <button type='submit' disabled={isChatLoading || !question.trim()}>
              Enviar
            </button>
          </form>
        </section>
        {/* Lado direito: Ingestão e Status dos Jobs */
          <section className='side-panel'>
            {/* Formulário de Upload */}
            <div className="card">
              <h2>📄 Ingestão de Arquivos</h2>
              <form onSubmit={handleUpload} className='upload-form'>
                <input
                  type='file'
                  onChange={handleFileChange}
                  disabled={isUploading}
                  accept='.pdf,.docx,.txt,.html'
                />
                <button
                  type='submit'
                  disabled={!selectedFile || isUploading}
                  className='btn-primary'
                >
                  {isUploading ? 'Enviando' : 'Fazer upload e Processar'}
                </button>
              </form>
              {uploadMessage && <div className='feedback-msg'>{uploadMessage}</div>}
            </div>

            {/* Monitoramento de Jobs */}
            <div className='card'>
              <h2>⏳ Status dos Jobs de Ingestão</h2>
              {trackedJobs.length === 0 ? (
                <p className='empty-text'>Nenhum job de ingestão rastreado no momento</p>
              ) : (
                <div className='jobs-list'>
                  {trackedJobs.map((job) => (
                    <div key={job.jobId} className='job-item'>
                      <div className='job-header'>
                        <span className='job-file'>{job.fileName || 'Arquivo'}</span>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className='job-id'>ID: {job.jobId}</div>
                      {job.errorMessage && (
                        <div className='job-error'>Error: {job.errorMessage}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </section>
        }
      </div >
    </div >
  )
}

export default App
