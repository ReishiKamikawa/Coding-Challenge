class WebSocketService {
    constructor() {
        this.ws = null;
        this.listeners = new Map();
    }

    connect() {
        this.ws = new WebSocket('ws://localhost:3000');

        this.ws.onopen = () => {
            console.log('WebSocket Connected');
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const listeners = this.listeners.get(data.type) || [];
            listeners.forEach(listener => listener(data.payload));
        };

        this.ws.onclose = () => {
            console.log('WebSocket Disconnected');
            // Attempt to reconnect after 5 seconds
            setTimeout(() => this.connect(), 5000);
        };
    }

    subscribe(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);
    }

    unsubscribe(eventType, callback) {
        if (!this.listeners.has(eventType)) return;
        const listeners = this.listeners.get(eventType);
        this.listeners.set(
            eventType,
            listeners.filter(listener => listener !== callback)
        );
    }

    send(eventType, payload) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: eventType, payload }));
        }
    }
}

export const wsService = new WebSocketService();
