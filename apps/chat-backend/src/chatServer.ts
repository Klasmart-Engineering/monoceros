import { WebSocketServer } from "ws";
import { Client } from "./client";

export class ChatServer {
    private wss: WebSocketServer
    private clients = new Set<Client>()

    public constructor(port: number) {
        this.wss = new WebSocketServer({
            port,
        });
        this.wss.on("connection", (ws, req) => {
            const client = new Client(this, ws)
            this.clients.add(client)
            ws.on("close", () => {
                this.clients.delete(client)
                console.log(`Client(${client.clientId}) disconnected (${this.clients.size} clients connected)`)
            })
            console.log(`Client(${client.clientId}) connected from ${JSON.stringify(req.socket.address())}, (${this.clients.size} clients connected)`)
        });
        console.log(this.wss.address())
    }

    public broadcast(message: string, except?: Client) {
        for(const client of this.clients) {
            if(client === except) { continue; }
            client.send(message)
        }
    }
}

