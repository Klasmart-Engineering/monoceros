import { WebSocket } from "ws";
import { KeepAliveWebSocket } from "./KeepAliveWebSocket";
import { ChatServer } from "./chatServer";
import { ChatMessage, ChatRequest } from "@kl-engineering/chat-protocol";

export class Client {
    private static nextId = 0;
    
    public readonly clientId = Client.nextId++;
    private websocket: KeepAliveWebSocket;

    public constructor(
        private server: ChatServer,
        ws: WebSocket,
    ) {
        this.websocket = new KeepAliveWebSocket(ws)
        this.websocket.on("message", m => this.onMessage(m))
    }

    public send(data: string) {
        return this.websocket.send(data);
    }

    private onMessage(data: string | ArrayBuffer | Blob) {
        try {
            if(typeof data !== "string") { return; }
            const message = JSON.parse(data);
            if(typeof message !== "object") { return; }
            this.handleMessage(message);
        } catch(e) {
            console.log(e)
        }
    }

    private handleMessage(request: ChatRequest) {
        if(request.sendMessage) {
            const chatMessage: ChatMessage = {
                timestamp: Date.now(),
                message: request.sendMessage.contents,
                name: `Client(${this.clientId})`
            }
            this.server.broadcast({chatMessage})
        }
    }

}
