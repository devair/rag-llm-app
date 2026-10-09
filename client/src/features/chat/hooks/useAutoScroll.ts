import { useEffect, useRef } from "react"
import type { ChatMessage } from "../../../types/api"

interface AutoScrollProps {
    messages: ChatMessage[]
    isLoading: boolean
}

/**
 * Responsabilidade única: manter o chat rolado até a última mensagem.
 */
export function useAutoScroll({ messages, isLoading }: AutoScrollProps) {
    const endRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    return endRef
}