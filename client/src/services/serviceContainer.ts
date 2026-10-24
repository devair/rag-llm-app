import { HttpChatService } from "./HttpChatService"
import { HttpIngestionService } from "./HttpIngestionService"
import { HttpSessionService } from "./HttpSessionService"
import { HttpKnowledgeBaseService } from "./HttpKnowledgeBaseService"
import type { IChatService } from "./interfaces/IChatService"
import type { IIngestionService } from "./interfaces/IIngestionService"
import type { ISessionService } from "./interfaces/ISessionService"
import type { IKnowledgeBaseService } from "./interfaces/IKnowledgeBaseService"

export const chatService: IChatService = new HttpChatService()
export const ingestionService: IIngestionService = new HttpIngestionService()
export const sessionService: ISessionService = new HttpSessionService()
export const knowledgeBaseService: IKnowledgeBaseService = new HttpKnowledgeBaseService()