import { ChatMessage, ChatServerMessage } from "@kl-engineering/chat-protocol";
import { WebSocketServer } from "ws";
import { Client } from "./client";

export class ChatServer {
    private wss: WebSocketServer
    private clients = new Set<Client>()
    private chatHistory: ChatMessage[] = []

    public constructor(port: number) {
        this.wss = new WebSocketServer({
            port,
        });
        this.wss.on("connection", (ws, req) => {
            const client = new Client(this, ws)
            this.chatHistory.forEach(chatMessage => client.sendMessage({chatMessage}))
            this.clients.add(client)
            ws.on("close", () => {
                this.clients.delete(client)
                console.log(`Client(${client.clientId}) disconnected (${this.clients.size} clients connected)`)
            })
            console.log(`Client(${client.clientId}) connected from ${JSON.stringify(req.socket.address())}, (${this.clients.size} clients connected)`)
        });
        console.log(this.wss.address())
    }

    public broadcastChatMessage(chatMessage: ChatMessage) {
        this.chatHistory.push(chatMessage)
        return this.broadcast({chatMessage})
    }

    public broadcast(response: ChatServerMessage, except?: Client) {
        const data = JSON.stringify(response)
        for(const client of this.clients) {
            if(client === except) { continue; }
            client.send(data)
        }
    }
}

