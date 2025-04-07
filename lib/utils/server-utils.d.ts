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
declare class ChannelManager {
    private channels;
    constructor();
    addClient(channel: string, client: NodeJS.WritableStream): void;
    removeClient(channel: string, client: NodeJS.WritableStream): void;
    getClients(channel: string): Set<NodeJS.WritableStream>;
    getConnectionCounts(): Record<string, number>;
    getConnectionCount(channel: string): number;
}
declare class MessageHistory {
    private messageHistory;
    private lastId;
    constructor(messageHistory?: Array<TMessageHistoryItem>, lastId?: number);
    messageHistoryForChannel(channelName: string, lastEventId: number | undefined): TMessage[];
    push(channelName: string, message: TMessage): void;
    nextId(): number;
}
export { ChannelManager, MessageHistory, type TMessage, type TMessageHistoryItem, };
