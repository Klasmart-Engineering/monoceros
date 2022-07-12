import { ChatClientMessage, ChatMessage, ChatProcedureNames, ChatRpc, ChatServerMessage } from "@kl-engineering/chat-protocol";
import React, { FC, PropsWithChildren, useCallback, useContext, useEffect, useMemo } from "react";
import { ConnectionState, KeepAliveWebSocket } from "./KeepAliveWebSocket";
import { PromiseCompleterMap } from "./promiseCompleter";
import { ReactiveWrapper } from "./reactiveWrapper";


/**
 * Maintain a connection to the server, recreating connections upon interupt
 * process incoming network messages for state replication
 */
class NetworkState {
    public chatMessages = new ReactiveWrapper<ChatMessage[]>([]);
    public connectionState = new ReactiveWrapper<ConnectionState>("not-connected");
    
    private websocket?: KeepAliveWebSocket
    private failedConnectionCount = 0;
    private reconnectTimeout?: ReturnType<typeof setTimeout>
    
    private pendingRequests = new PromiseCompleterMap();
    
    public constructor(
        private readonly url = new URL("ws://localhost:3000/"),
        private mayConnect = true,
    ) {
        console.log(`Constructing NetworkState`, this)
    }

    public connect() {
        this.mayConnect = true;
        this.reconnect();
    }

    public async rpc<P extends ChatProcedureNames>(
        procedure: P,
        request: ChatRpc<P>["Request"],
    ): Promise<ChatRpc<P>["Response"]> {
        return this.pendingRequests.createPromise<ChatRpc<P>["Request"]>(
            id => this.send({id, procedure, request})
        );
    }

    public close() {
        this.mayConnect = false;
        this.destroyWebsocket();
        console.log('close', this.websocket, this.websocket?.state())
    }

    private send(message: ChatClientMessage<ChatProcedureNames>): boolean {
        if(!this.websocket) { this.websocket = this.createWebsocket(); }
        if(!this.websocket) { return false; }
        const data = JSON.stringify(message);
        return this.websocket.send(data);
    }

    private handleNetworkStateChange(state: ConnectionState) {
        console.log(state)
        switch(state) {
            case "connected":
                this.failedConnectionCount = 0;
                return;
            case "not-connected":
                this.failedConnectionCount++;
                this.destroyWebsocket();
                this.scheduleReconnect();
                return;
        }
    }

    private scheduleReconnect() {
        if(!this.mayConnect) { return; }
        if(this.reconnectTimeout) { return; }

        // https://en.wikipedia.org/wiki/Exponential_backoff
        const maxReconnectCooldownMs = 100 * Math.pow(2, this.failedConnectionCount);
        const reconnectCooldownMs = Math.random() * maxReconnectCooldownMs;

        console.log(`scheduling reconnect ${reconnectCooldownMs}`)
        this.reconnectTimeout = setTimeout(
            () => this.reconnect(),
            reconnectCooldownMs,
        )
    }

    private reconnect() {
        if(this.reconnectTimeout) { clearTimeout(this.reconnectTimeout); }
        this.reconnectTimeout = undefined;

        // if(!force && this.websocket?.state() !== "not-connected") { return; }

        if(this.websocket) { this.destroyWebsocket(); }
        this.websocket = this.createWebsocket();
        
        console.log(`connect`, this.websocket, this.websocket?.state())
    }

    private destroyWebsocket() {
        if(!this.websocket) { return; }
        this.websocket.off("message", d => this.onMessage(d))
        this.websocket.off("statechange", s => this.handleNetworkStateChange(s))
        if(this.websocket.state() !== "not-connected") { this.websocket.close(); }
        this.websocket = undefined;
    }

    private createWebsocket() {
        if(!this.mayConnect) { return; }
        const rawWebSocket = new WebSocket(this.url.toString())
        const websocket = new KeepAliveWebSocket(rawWebSocket);
        websocket.on("message", d => this.onMessage(d))
        websocket.on("statechange", s => this.handleNetworkStateChange(s))
        return websocket
    }

    private onMessage(data: string | ArrayBuffer | Blob) {
        try {
            if(typeof data !== "string") { return; }
            const message: ChatServerMessage = JSON.parse(data);
            if(typeof message !== "object") { return; }
            if('rpc' in message) { this.handleRpcResponse(message.rpc); }
            if('chatMessage' in message) { this.handleChatMessage(message.chatMessage); }
        } catch(e) {
            console.log(e)
        }
    }

    private handleRpcResponse(response: ChatRpc<ChatProcedureNames>["RpcResponse"]) {
        const id = response.id;
        if('error' in response) {
            this.pendingRequests.reject(id, response.error);
        } else if('response' in response) {
            this.pendingRequests.resolve(id, response.response);
        } else {
            this.pendingRequests.reject(id, 'Empty Response');
        }
    }

    private handleChatMessage(chatMessage: ChatMessage) {
        this.chatMessages.mutate(messages => messages.push(chatMessage))
    }
}

export const NetworkContext = React.createContext<NetworkState>(null as never);
NetworkContext.displayName = "NetworkContext";

export const NetworkProvider: FC<PropsWithChildren<{url?: string}>> = (props) => {
    const state = useMemo(() => new NetworkState(), [])
    useEffect(() => {
        state.connect();
        return () => state.close()
    }, [state])
    console.log(`rendering NetworkProvider`)
    return (
        <NetworkContext.Provider value={state}>
            {props.children}
        </NetworkContext.Provider>
    );
}

export const useSendMessage = () => {
    const ctx = useContext(NetworkContext);
    return useCallback((message: string) => ctx.rpc("sendMessage", { contents: message }), [ctx]);
}

export const useMessages = () => useContext(NetworkContext).chatMessages.useValue();
export const useConectionState = () => useContext(NetworkContext).connectionState.useValue();

export default NetworkProvider;