declare class Client<EMap extends Record<string, any>> {
    private eventSource;
    private _callbacks;
    private onOpenBound;
    private onErrorBound;
    private closeBound;
    constructor(path: string, channel?: string);
    onOpen(_event: MessageEvent): void;
    onError(_event: MessageEvent): void;
    close(): void;
    addEventListener<K extends keyof EMap & string>(eventName: K, _callback: (event: {
        type: K;
        data: EMap[K];
    }) => void): () => void;
    removeEventListener(eventName: string): void;
    removeAllEventListener(): void;
}

export { Client };
