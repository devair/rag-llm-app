/**
 * Parser mínimo de Server-Sent Events (SSE) sobre ReadableStream.
 *
 * Usa fetch + ReadableStream (em vez de EventSource) porque precisa
 * enviar o corpo da pergunta via POST — EventSource só suporta GET.
 */

export interface SseEvent {
    event: string
    data: string
}

/** Converte um bloco bruto de texto SSE em eventos tipados. */
export function parseSseChunk(raw: string): SseEvent[] {
    const events: SseEvent[] = []

    // Cada evento é separado por linha em branco; blocos podem ter
    // múltiplas linhas "data:" que devem ser concatenadas com "\n".
    for (const block of raw.split(/\r?\n\r?\n/)) {
        if (!block.trim()) continue

        let eventName = 'message'
        const dataLines: string[] = []

        for (const line of block.split(/\r?\n/)) {
            if (line.startsWith(':')) continue // comentário / keep-alive ping
            if (line.startsWith('event:')) {
                eventName = line.slice('event:'.length).trim()
            } else if (line.startsWith('data:')) {
                dataLines.push(line.slice('data:'.length).replace(/^ /, ''))
            }
        }

        if (dataLines.length > 0) {
            events.push({ event: eventName, data: dataLines.join('\n') })
        }
    }

    return events
}

/**
 * Consome uma resposta SSE e invoca onEvent para cada evento completo.
 * Buffers entre reads para tratar eventos divididos entre chunks.
 */
export async function consumeSseStream(
    response: Response,
    onEvent: (event: SseEvent) => void,
    signal?: AbortSignal
): Promise<void> {
    if (!response.body) {
        throw new Error('A resposta não possui corpo para streaming.')
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
    let buffer = ''

    try {
        while (true) {
            const { value, done } = await reader.read()
            if (done || signal?.aborted) break

            buffer += value

            // Extrai todos os eventos completos (terminados por linha em dupla quebra de linha).
            let separatorMatch = buffer.match(/\r?\n\r?\n/)
            while (separatorMatch && separatorMatch.index !== undefined) {
                const readyPart = buffer.slice(0, separatorMatch.index)
                buffer = buffer.slice(separatorMatch.index + separatorMatch[0].length)

                for (const event of parseSseChunk(readyPart)) {
                    onEvent(event)
                }
                separatorMatch = buffer.match(/\r?\n\r?\n/)
            }
        }

        // Processa qualquer evento restante no buffer ao final do stream.
        if (buffer.trim()) {
            for (const event of parseSseChunk(buffer)) {
                onEvent(event)
            }
        }
    } finally {
        reader.releaseLock()
    }
}
