import { ChatMessage, ChatServerMessage } from "@kl-engineering/chat-protocol";
import Redis from "ioredis";

export class SharedState {
    constructor(
        private readonly broadcast: (response: ChatServerMessage) => unknown,
        private redis = new Redis(),
    ) {
        this.redis.connect(() => {
            console.log(`Connected to Redis`)
            this.subscibe()
        })
    }

    public async addChatMessage(chatMessage: ChatMessage) {
        const data = JSON.stringify(chatMessage)
        try {
            await this.redis.xadd("chatMessages", "MAXLEN", "10", "*", "json", data)
        } catch(e) {
            console.log("xadd",e);
        }
    }

    public async getHistory() {
        const redis = this.redis.duplicate()
        try {
            const [,newChatMessages] = await readStreamJson<ChatMessage>(redis)
            return newChatMessages
        } finally {
            redis.disconnect()
        }
    }

    private async subscibe() {
        const redis = this.redis.duplicate()
        try {
            let lastMessageId = "0";
            // eslint-disable-next-line no-constant-condition
            while(true) {
                console.log("Waiting for new messages...")
                const [newestMessageId, newChatMessages] = await readStreamJson<ChatMessage>(redis, lastMessageId)
                console.log("newChatMessages", newChatMessages)
                newChatMessages.forEach(chatMessage => this.broadcast({chatMessage}))
                lastMessageId = newestMessageId;
            }
        } finally {
            redis.disconnect()
        }
    }
}

async function readStreamJson<T>(redis: Redis, lastMessageId = "0") {
    let newestMessageId = lastMessageId;
    const objects: T[] = []

    await readStream(redis, lastMessageId, (id, fields) => {
        newestMessageId = id;
        for(let i=0; i+1 < fields.length; i+=2) {
            const field = fields[i];
            if(field !== "json") { continue }
            const value = fields[i+1];
            if(!value) { continue }
            try {
                const object = JSON.parse(value)
                objects.push(object)
            } catch {
                console.log(`Failed to parse message(${id})`)
            }
        }
    })

    return [newestMessageId, objects] as const;
}

async function readStream(redis: Redis, newestMessageId = "0", callback: (id: string, fields: string[]) => unknown) {
    const values = await redis.xread("BLOCK", 10000, "STREAMS", "chatMessages", newestMessageId)
    if(!values) { return }
    for(const [,messages] of values) {
        for(const [id, fields] of messages) {
            newestMessageId = id
            callback(id, fields);
        }
    }
}