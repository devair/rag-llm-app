import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../../types/api'

interface AutoScrollProps {
    messages: ChatMessage[]
    isLoading: boolean
}

/**
 * Scroll automaticamente para a última mensagem ou área de carga
 */
export function useAutoScroll({ messages, isLoading }: AutoScrollProps) {
    const endRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (endRef.current) {
            endRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, isLoading])

    return endRef
}
