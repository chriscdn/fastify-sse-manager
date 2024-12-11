declare class Client<T> {
    private eventSource;
    private _callbacks;
    private onOpenBound;
    private onErrorBound;
    private closeBound;
    constructor(path: string);
    onOpen(event: MessageEvent): void;
    onError(event: MessageEvent): void;
    close(): void;
    addEventListener<T>(eventName: string, _callback: ({ type, data }: {
        type: string;
        data: T;
    }) => void): void;
    removeEventListener(eventName: string): void;
    removeAllEventListener(): void;
}
export { Client };
