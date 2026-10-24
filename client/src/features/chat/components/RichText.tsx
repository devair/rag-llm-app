import type { ReactNode } from "react"

type TextBlock =
    | { type: "paragraph"; lines: string[] }
    | { type: "heading"; level: number; text: string }
    | { type: "list"; ordered: boolean; items: string[] }
    | { type: "quote"; lines: string[] }
    | { type: "code"; code: string }

function expandInlineNumberedLists(line: string): string[] {
    const markers: Array<{ number: number; start: number; end: number }> = []
    const markerPattern = /(?:^|[.!?:]\s+)(\d+)[.)]\s+/g
    let match: RegExpExecArray | null

    while ((match = markerPattern.exec(line)) !== null) {
        const numberOffset = match[0].lastIndexOf(match[1])
        markers.push({
            number: Number(match[1]),
            start: match.index + numberOffset,
            end: markerPattern.lastIndex
        })
    }

    for (let start = 0; start < markers.length; start += 1) {
        if (markers[start].number !== 1) continue

        let end = start + 1
        while (
            end < markers.length &&
            markers[end].number === markers[end - 1].number + 1
        ) {
            end += 1
        }
        if (end - start < 2) continue

        const prefix = line.slice(0, markers[start].start).trim()
        const items = markers.slice(start, end).map((marker, index) => {
            const nextMarker = markers[start + index + 1]
            return line.slice(marker.end, nextMarker?.start ?? line.length).trim()
        })

        return [...(prefix ? [prefix] : []), ...items.map((item, index) => `${index + 1}. ${item}`)]
    }

    return [line]
}

function isBlockStart(line: string): boolean {
    return /^(#{1,6}\s+|```|>\s?|[-*+]\s+|\d+[.)]\s+)/.test(line)
}

function parseBlocks(text: string): TextBlock[] {
    const lines = text
        .replace(/\r\n?/g, "\n")
        .split("\n")
        .flatMap(expandInlineNumberedLists)
    const blocks: TextBlock[] = []
    let index = 0

    while (index < lines.length) {
        const line = lines[index]
        if (!line.trim()) {
            index += 1
            continue
        }

        if (line.startsWith("```")) {
            const codeLines: string[] = []
            index += 1
            while (index < lines.length && !lines[index].startsWith("```")) {
                codeLines.push(lines[index])
                index += 1
            }
            if (index < lines.length) index += 1
            blocks.push({ type: "code", code: codeLines.join("\n") })
            continue
        }

        const heading = line.match(/^(#{1,6})\s+(.+)$/)
        if (heading) {
            blocks.push({ type: "heading", level: heading[1].length, text: heading[2] })
            index += 1
            continue
        }

        const listItem = line.match(/^\s*([-*+]|\d+[.)])\s+(.+)$/)
        if (listItem) {
            const ordered = /^\d/.test(listItem[1])
            const items = [listItem[2]]
            index += 1

            while (index < lines.length) {
                const nextItem = lines[index].match(/^\s*([-*+]|\d+[.)])\s+(.+)$/)
                if (!nextItem || /^\d/.test(nextItem[1]) !== ordered) break
                items.push(nextItem[2])
                index += 1
            }
            blocks.push({ type: "list", ordered, items })
            continue
        }

        if (/^>\s?/.test(line)) {
            const quoteLines: string[] = []
            while (index < lines.length && /^>\s?/.test(lines[index])) {
                quoteLines.push(lines[index].replace(/^>\s?/, ""))
                index += 1
            }
            blocks.push({ type: "quote", lines: quoteLines })
            continue
        }

        const paragraphLines = [line]
        index += 1
        while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
            paragraphLines.push(lines[index])
            index += 1
        }
        blocks.push({ type: "paragraph", lines: paragraphLines })
    }

    return blocks
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
    const pattern = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`|\*[^*]+\*|_[^_]+_)/g
    const nodes: ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    let key = 0

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index))
        }

        const token = match[0]
        const content = token.slice(token.startsWith("**") || token.startsWith("__") ||
            token.startsWith("~~") ? 2 : 1, -(token.startsWith("**") ||
            token.startsWith("__") || token.startsWith("~~") ? 2 : 1))
        const nodeKey = `${keyPrefix}-${key++}`

        if (token.startsWith("**") || token.startsWith("__")) {
            nodes.push(<strong key={nodeKey}>{content}</strong>)
        } else if (token.startsWith("~~")) {
            nodes.push(<del key={nodeKey}>{content}</del>)
        } else if (token.startsWith("`")) {
            nodes.push(<code key={nodeKey}>{content}</code>)
        } else {
            nodes.push(<em key={nodeKey}>{content}</em>)
        }
        lastIndex = pattern.lastIndex
    }

    if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
    return nodes
}

function renderLines(lines: string[], keyPrefix: string): ReactNode[] {
    return lines.flatMap((line, index) => [
        ...(index > 0 ? [<br key={`${keyPrefix}-break-${index}`} />] : []),
        ...renderInline(line, `${keyPrefix}-${index}`)
    ])
}

export function RichText({ text }: { text: string }) {
    const blocks = parseBlocks(text)

    return (
        <div className="rich-text">
            {blocks.map((block, index) => {
                const key = `block-${index}`
                if (block.type === "heading") {
                    const content = renderInline(block.text, key)
                    switch (block.level) {
                        case 1: return <h1 key={key}>{content}</h1>
                        case 2: return <h2 key={key}>{content}</h2>
                        case 3: return <h3 key={key}>{content}</h3>
                        case 4: return <h4 key={key}>{content}</h4>
                        case 5: return <h5 key={key}>{content}</h5>
                        default: return <h6 key={key}>{content}</h6>
                    }
                }

                if (block.type === "list") {
                    const List = block.ordered ? "ol" : "ul"
                    return (
                        <List key={key}>
                            {block.items.map((item, itemIndex) => (
                                <li key={`${key}-item-${itemIndex}`}>
                                    {renderInline(item, `${key}-item-${itemIndex}`)}
                                </li>
                            ))}
                        </List>
                    )
                }

                if (block.type === "quote") {
                    return <blockquote key={key}>{renderLines(block.lines, key)}</blockquote>
                }

                if (block.type === "code") {
                    return <pre key={key}><code>{block.code}</code></pre>
                }

                return <p key={key}>{renderLines(block.lines, key)}</p>
            })}
        </div>
    )
}
