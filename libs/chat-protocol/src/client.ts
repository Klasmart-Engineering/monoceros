import { ChatProcedureNames, ChatRpc } from "./chatRpc";

export type ChatClientMessage<P extends ChatProcedureNames> = ChatRpc<P>["RpcRequest"];


