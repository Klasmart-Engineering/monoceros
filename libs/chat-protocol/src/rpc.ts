export type Rpc<
    RpcMap extends ProcedureRequestResponseMap,
    P extends keyof ProcedureRequestResponseMap,
> = {
  ProcedureNames: keyof RpcMap;

  Procedure: Procedure<RpcMap, P>;
  Request: Request<RpcMap, P>;
  Response: Response<RpcMap, P>;

  RpcRequest: RpcRequest<RpcMap, P>;
  RpcResponse: RpcResponse<RpcMap, P>;
};

export type RpcRequest<
  RpcMap extends ProcedureRequestResponseMap,
  P extends keyof RpcMap
> = {
  id: number;
  procedureName: P;
  request: Request<RpcMap, P>;
};

export type RpcResponse<
  RpcMap extends ProcedureRequestResponseMap,
  P extends keyof RpcMap
> = { id: number } & ({ error: string } | { response: Response<RpcMap, P> });

export type Procedure<
  RpcMap extends ProcedureRequestResponseMap,
  P extends keyof RpcMap
> = (request: Request<RpcMap, P>) => Response<RpcMap, P>;

export type Request<
  RpcMap extends ProcedureRequestResponseMap,
  P extends keyof RpcMap
> = RpcMap[P][0];

export type Response<
  RpcMap extends ProcedureRequestResponseMap,
  P extends keyof RpcMap
> = RpcMap[P][1];

export type ProcedureRequestResponseMap<
  ProcedureNames extends string = string,
  Requests = unknown,
  Responses = unknown
> = {
  [p in ProcedureNames]: [Requests, Responses];
};
