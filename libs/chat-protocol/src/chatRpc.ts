import { GetUsersRequest, GetUsersResponse } from './procedures/getUsers';
import {
  SendMessageRequest,
  SendMessageResponse,
} from './procedures/sendMessage';
import { SetNameRequest, SetNameResponse } from './procedures/setName';
import { Rpc } from './rpc';

export type ChatRpc<P extends ChatProcedureNames> = Rpc<
  ChatProcedureRequestResponseMap,
  P
>;

export type ChatProcedureNames = keyof ChatProcedureRequestResponseMap;

export type ChatProcedures = {
  [P in ChatProcedureNames]: ChatRpc<P>['Procedure'];
};

export type ChatProcedureRequestResponseMap = {
  getUsers: [GetUsersRequest, GetUsersResponse];
  setName: [SetNameRequest, SetNameResponse];
  sendMessage: [SendMessageRequest, SendMessageResponse];
};

// export type ChatProcedureNames = keyof ChatProcedureRequestResponseMap;

// export type ChatProcedures = { [P in ChatProcedureNames]: ChatProcedure<P> };

// export type ChatProcedure<P extends ChatProcedureNames> = (
//   request: ChatRequest<P>
// ) => ChatResponse<P>;

// export type ChatRequest<P extends ChatProcedureNames> =
//   ChatProcedureRequestResponseMap[P][0];

// export type ChatResponse<P extends ChatProcedureNames> =
//   ChatProcedureRequestResponseMap[P][1];
