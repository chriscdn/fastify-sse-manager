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
    addEventListener<EMap extends Record<string, any>, T extends keyof EMap & string>(eventName: T, _callback: ({ type, data }: {
        type: T;
        data: EMap[T];
    }) => void): void;
    removeEventListener(eventName: string): void;
    removeAllEventListener(): void;
}
export { Client };
