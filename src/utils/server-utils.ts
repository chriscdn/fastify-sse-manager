type TMessage = {
    event: string;
    data: string;
    id: number;
};

type TMessageHistoryItem = {
    channelName: string;
    id: number;
    message: TMessage;
};

class ChannelManager {
    private channels: Map<string, Set<NodeJS.WritableStream>>;

    constructor() {
        this.channels = new Map();
    }

    addClient(channel: string, client: NodeJS.WritableStream): void {
        const clients = this.getClients(channel);
        clients.add(client);
    }

    removeClient(channel: string, client: NodeJS.WritableStream): void {
        const clients = this.getClients(channel);
        clients.delete(client);
        if (clients.size === 0) {
            this.channels.delete(channel);
        }
    }

    getClients(channel: string): Set<NodeJS.WritableStream> {
        if (!this.channels.has(channel)) {
            this.channels.set(channel, new Set());
        }
        return this.channels.get(channel)!;
    }

    getConnectionCounts(): Record<string, number> {
        const result: Record<string, number> = {};
        for (const [channel, clients] of this.channels.entries()) {
            result[channel] = clients.size;
        }
        return result;
    }

    getConnectionCount(channel: string): number {
        const clients = this.channels.get(channel);
        return clients ? clients.size : 0;
    }
}

class MessageHistory {
    constructor(
        private messageHistory: Array<TMessageHistoryItem> = [],
        private lastId: number = 0,
    ) {}

    messageHistoryForChannel(
        channelName: string,
        lastEventId: number | undefined,
    ) {
        return lastEventId !== undefined
            ? this.messageHistory
                .filter((item) => item.channelName === channelName)
                .filter((item) => item.id > lastEventId)
                .map((item) => item.message)
            : [];
    }

    push(channelName: string, message: TMessage) {
        this.messageHistory.push({ channelName, id: message.id, message });

        // keep last 10000 messages.. TODO: make configurable
        this.messageHistory = this.messageHistory.slice(-10000);
    }

    nextId() {
        this.lastId += 1;
        return this.lastId;
    }
}

export {
    ChannelManager,
    MessageHistory,
    type TMessage,
    type TMessageHistoryItem,
};
