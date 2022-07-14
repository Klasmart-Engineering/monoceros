import { ChatMessage, ChatServerMessage } from "@kl-engineering/chat-protocol";
import Redis from "ioredis";

export class SharedState {
    public chatHistory: ChatMessage[] = []

    constructor(
        private readonly broadcast: (response: ChatServerMessage) => unknown,
        private redis = new Redis(),
    ) {
        this.redis.connect(() => {
            console.log(`Connected to Redis`)
        })
    }

    public broadcastChatMessage(chatMessage: ChatMessage) {
        this.chatHistory.push(chatMessage)
        return this.broadcast({chatMessage})
    }
}