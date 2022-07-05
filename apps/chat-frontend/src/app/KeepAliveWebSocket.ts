import { EventEmitter } from "eventemitter3";

/**
 * Wrap a Websocket to send and monitor keep alive messages
 */
export class KeepAliveWebSocket {
    private emitter = new EventEmitter<KeepAliveWebSocketEventMap>();
    private receiveTimeoutReference?: Timeout;
    private sendTimeoutReference?: Timeout;

    constructor(
        private readonly websocket: WebSocket,
        private receiveMessageTimeoutTime = 5000,
        private sendKeepAliveMessageInterval = 1000,
    ) {
        websocket.addEventListener("open", () => {
            this.resetNetworkReceiveTimeout();
            this.resetNetworkSendTimeout();
            this.emitter.emit("statechange", getConnectionState(this.websocket))
        });
        websocket.addEventListener("close", () => this.emitter.emit("statechange", getConnectionState(this.websocket)));
        websocket.addEventListener("error", () => this.emitter.emit("statechange", getConnectionState(this.websocket)));
        websocket.addEventListener("message", e => {
            this.resetNetworkReceiveTimeout();
            if(typeof e.data !== 'string') return;
            this.emitter.emit("message", e.data);
        });
    }
    
    public readonly on: KeepAliveWebSocket["emitter"]["on"] = (event, listener) => this.emitter.on(event, listener);
    public readonly off: KeepAliveWebSocket["emitter"]["off"] = (event, listener) => this.emitter.off(event, listener);
    public readonly once: KeepAliveWebSocket["emitter"]["once"] = (event, listener) => this.emitter.once(event, listener);

    public state = () => getConnectionState(this.websocket)

    public send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        try {
            this.websocket.send(data);
            this.resetNetworkSendTimeout();
            return true;
        } catch {
            return false;
        }
    }

    public close() { this.websocket.close(); }

    private resetNetworkReceiveTimeout() {
        if (this.receiveTimeoutReference) { clearTimeout(this.receiveTimeoutReference); }
        this.receiveTimeoutReference = setTimeout(
            () => this.websocket.close(4400, "timeout"),
            this.receiveMessageTimeoutTime
        );
    }

    private resetNetworkSendTimeout() {
        if (this.sendTimeoutReference) { clearTimeout(this.sendTimeoutReference); }
        this.sendTimeoutReference = setTimeout(
            () => {
                this.send(KeepAliveWebSocket.keepAliveMessage)
            },
            this.sendKeepAliveMessageInterval
        );
    }

    private static readonly keepAliveMessage = new Uint8Array(0)
}

export type KeepAliveWebSocketEventMap = {
    statechange: [ConnectionState];
    message: [string | ArrayBuffer | Blob];
}

export type ConnectionState = "connected" | "connecting" | "not-connected"
export const getConnectionState = (websocket: WebSocket): ConnectionState => {
    switch (websocket.readyState) {
        case WebSocket.OPEN:
            return "connected"
        case WebSocket.CONNECTING:
            return "connecting"
        case WebSocket.CLOSING:
        case WebSocket.CLOSED:
        default:
            return "not-connected"
    }
}

type Timeout = ReturnType<typeof setTimeout>;