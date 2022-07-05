import { WebSocket } from "ws";
import { KeepAliveWebSocket } from "./KeepAliveWebSocket";
import { ChatServer } from "./chatServer";

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

    public send(message: string) {
        console.log(`sending to client(${this.clientId})`, message)
        const data = JSON.stringify(message);
        return this.websocket.send(data);
    }

    private onMessage(data: string | ArrayBuffer | Blob) {
        try {
            if(typeof data !== "string") { return; }
            const message = JSON.parse(data);
            if(typeof message !== "string") { return; }
            this.handleMessage(message);
        } catch(e) {
            console.log(e)
        }
    }

    private handleMessage(message: string) {
        console.log('message', message)

        this.server.broadcast(message)
    }

}
