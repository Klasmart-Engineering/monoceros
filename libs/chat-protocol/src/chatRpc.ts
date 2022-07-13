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
