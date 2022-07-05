import React, { FC, PropsWithChildren, useCallback, useContext, useEffect, useMemo } from "react";
import { ConnectionState, KeepAliveWebSocket } from "./KeepAliveWebSocket";
import { ReactiveWrapper } from "./reactiveWrapper";


/**
 * Maintain a connection to the server, recreating connections upon interupt
 * process incoming network messages for state replication
 */
class NetworkState {
    public chatMessages = new ReactiveWrapper<string[]>([]);
    public networkState = new ReactiveWrapper<ConnectionState>("not-connected");

    private websocket?: KeepAliveWebSocket
    private failedConnectionCount = 0;
    private reconnectTimeout?: ReturnType<typeof setTimeout>

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

    public send(message: string): boolean {
        if(!this.websocket) { this.websocket = this.createWebsocket(); }
        if(!this.websocket) { return false; }
        const data = JSON.stringify(message);
        return this.websocket.send(data);
    }

    public close() {
        this.mayConnect = false;
        this.destroyWebsocket();
        console.log('close', this.websocket, this.websocket?.state())
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
            const message = JSON.parse(data);
            this.handleMessage(message)
        } catch(e) {
            console.log(e)
        }
    }

    private handleMessage(message: string) {
        this.chatMessages.mutate(messages => messages.push(message))
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
    return useCallback((message: string) => ctx.send(message), [ctx])
}

export const useMessages = () => useContext(NetworkContext).chatMessages.useValue();
export const useConection = () => useContext(NetworkContext).networkState.useValue();

export default NetworkProvider;