export class DocumentChunk {

    constructor(
        public readonly id: string,
        public readonly documentName: string,
        public readonly content: string,
        public readonly embedding: number[],
        public readonly createdAt?: Date

    ) { }
}