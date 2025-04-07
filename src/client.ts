import urlJoin from "url-join";

class Client<EMap extends Record<string, any>> {
  private eventSource: EventSource | null;
  private _callbacks: Record<string, any>;

  private onOpenBound: (event: MessageEvent) => void;
  private onErrorBound: (event: MessageEvent) => void;
  private closeBound: (event: MessageEvent) => void;

  constructor(path: string, channel?: string) {
    const resolvedPath = channel ? urlJoin(path, channel) : path;

    // console.log(`Connecting to: ${resolvedPath}`);

    this.eventSource = new EventSource(resolvedPath);

    this.onOpenBound = this.onOpen.bind(this);
    this.onErrorBound = this.onError.bind(this);
    this.closeBound = this.close.bind(this);

    // open and error are reserved
    this.eventSource.addEventListener("open", this.onOpenBound);
    this.eventSource.addEventListener("error", this.onErrorBound);

    // close is a standard message, hijacked for our purposes
    this.eventSource.addEventListener(
      "close",
      this.closeBound,
    );

    // keep record of our callback functions to make them available to removeEventListener
    this._callbacks = {};
  }

  onOpen(event: MessageEvent) {
    // console.log("onOpen");
  }
  onError(event: MessageEvent) {
    // console.log("onError");
  }

  close() {
    // close and cleanup
    if (this.eventSource) {
      this.eventSource.removeEventListener("open", this.onOpenBound);
      this.eventSource.removeEventListener("error", this.onErrorBound);
      this.eventSource.removeEventListener("close", this.closeBound);
      this.removeAllEventListener();
      // this._callbacks = {};
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  addEventListener<K extends keyof EMap & string>(
    eventName: K,
    _callback: (event: { type: K; data: EMap[K] }) => void,
  ) {
    const callback = (event: MessageEvent) => {
      const data = JSON.parse(event.data) as EMap[K];

      _callback({
        type: eventName,
        data,
      });
    };

    // Only one listener at a time per event.
    this.removeEventListener(eventName);

    this._callbacks[eventName] = callback;

    this.eventSource?.addEventListener(eventName, callback);

    const stopListening = () => this.removeEventListener(eventName);

    return stopListening;
  }

  removeEventListener(eventName: string) {
    const callback = this._callbacks[eventName];

    if (callback) {
      this.eventSource?.removeEventListener(eventName, callback);
      delete this._callbacks[eventName];
    }
  }

  removeAllEventListener() {
    Object.keys(this._callbacks).forEach((callbackName) =>
      this.removeEventListener(callbackName)
    );
  }
}

// class ClientManager {
//   private clients: Map<string, Client> = new Map();

//   getClient(path: string, channel?: string) {
//     const resolvedPath = channel ? urlJoin(path, channel) : path;

//     if (!this.clients.has(resolvedPath)) {
//       this.clients.set(resolvedPath, new Client(resolvedPath));
//     }

//     const client = this.clients.get(resolvedPath)!;

//     const close = () => {
//       client.close();
//       this.clients.delete(resolvedPath);
//     };

//     return { close, client };
//   }
// }

export { Client };
