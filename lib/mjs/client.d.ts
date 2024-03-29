declare class Client<T> {
    private path;
    private eventSource;
    private _callbacks;
    constructor(path: string);
    onOpen(event: MessageEvent): void;
    onError(event: MessageEvent): void;
    close(): void;
    addEventListener<T>(eventName: string, _callback: ({ type, data }: {
        type: string;
        data: T;
    }) => void): void;
    removeEventListener(eventName: string): void;
}
export { Client };
