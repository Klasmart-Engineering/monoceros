import { ChatServer } from "./chatServer";

const port = Number(process.env['PORT']) || 3000 
new ChatServer(port)