import { WebSocket } from "ws";
import { KeepAliveWebSocket } from "./KeepAliveWebSocket";
import { ChatServer } from "./chatServer";
import { ChatClientMessage, ChatMessage, ChatProcedureNames, ChatProcedures, ChatServerMessage } from "@kl-engineering/chat-protocol";

export class Client {
    private static nextId = 0;
    
    public readonly clientId = Client.nextId++;
    
    private websocket: KeepAliveWebSocket;
    private name = `Client(${this.clientId})`;

    public constructor(
        private server: ChatServer,
        ws: WebSocket,
    ) {
        this.websocket = new KeepAliveWebSocket(ws)
        this.websocket.on("message", m => this.onMessage(m))
    }

    public sendMessage(message: ChatServerMessage) {
        const data = JSON.stringify(message);
        this.send(data);
    }

    public send(data: string | Blob | ArrayBufferLike | ArrayBufferView) {
        return this.websocket.send(data);
    }

    private onMessage(data: string | ArrayBuffer | Blob) {
        try {
            if(typeof data !== "string") { return; }
            const message: ChatClientMessage<ChatProcedureNames> = JSON.parse(data);
            if(typeof message !== "object") { return; }
            this.handleMessage(message);
        } catch(e) {
            console.log(e)
        }
    }

    private handleMessage<P extends ChatProcedureNames>({id, procedureName, request}: ChatClientMessage<P>) {
        try {
            const response = this.procedures[procedureName](request);
            this.sendMessage({ rpc: { id, response } })
        } catch(e) {
            this.sendMessage({ rpc: { id, error: `${e}` } })
        }

    }

    private procedures: ChatProcedures = {
        getUsers: async () => {
            throw new Error("Not Implemented")
        },
        setName: async ({name}) => {
            this.name = name; 
        },
        sendMessage: async (request) => {
            const chatMessage: ChatMessage = {
                timestamp: Date.now(),
                message: request.contents,
                name: this.name,
            }
            this.server.broadcastChatMessage(chatMessage)
            return {}
        },
    }



}