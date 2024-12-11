class Client<T> {
  private eventSource: EventSource | null;
  private _callbacks: Record<string, any>;

  private onOpenBound: (event: MessageEvent) => void;
  private onErrorBound: (event: MessageEvent) => void;
  private closeBound: (event: MessageEvent) => void;

  constructor(path: string) {
    this.eventSource = new EventSource(path);

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

  addEventListener<T>(
    eventName: string,
    _callback: ({ type, data }: { type: string; data: T }) => void,
  ) {
    const callback = (event: MessageEvent) => {
      const type: string = event.type;
      const data: T = JSON.parse(event.data);

      _callback({
        type,
        data,
      });
    };

    // Only one listenter at a time per event.  If a second is needed, then change the code and document why.
    this.removeEventListener(eventName);

    this._callbacks[eventName] = callback;

    this.eventSource?.addEventListener(eventName, callback);
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

export { Client };
