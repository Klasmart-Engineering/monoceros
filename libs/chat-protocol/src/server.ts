import { ChatProcedureNames, ChatRpc } from './chatRpc';

/* eslint-disable @typescript-eslint/ban-types */
export type ChatServerMessage = 
    | { rpc: ChatRpc<ChatProcedureNames>["RpcResponse"]; }
    | { chatMessage: ChatMessage; };

//Notifications
export type ChatMessage = {
  timestamp: number;
  name: string;
  message: string;
};
