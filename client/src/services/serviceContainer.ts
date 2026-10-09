import { HttpChatService } from "./HttpChatService"
import { HttpIngestionService } from "./HttpIngestionService"
import type { IChatService } from "./interfaces/IChatService"
import type { IIngestionService } from "./interfaces/IIngestionService"

export const chatService: IChatService = new HttpChatService()
export const ingestionService: IIngestionService = new HttpIngestionService()