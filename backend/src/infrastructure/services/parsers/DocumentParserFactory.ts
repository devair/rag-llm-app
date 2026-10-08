import { JSDOM } from "jsdom"
import mammoth from "mammoth"
import { PDFParse } from "pdf-parse"

export class DocumentParserFactory {

    static async parse(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
        const ext = filename.split('.').pop()?.toLowerCase()

        if (mimeType === 'application/pdf' || ext === 'pdf') {
            const parser = await new PDFParse({ data: buffer })
            const data = parser.getText()
            return (await data).text
        }

        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === 'docx') {
            const result = await mammoth.extractRawText({ buffer })
            return result.value
        }

        if (mimeType === 'text/html' || ext === 'html' || ext === 'txt'){
            const dom = new JSDOM(buffer.toString('utf8'))
            return dom.window.document.body.textContent || ''
        }            

        return buffer.toString('utf8')
    }
}