class Client<T> {
  private eventSource: EventSource | null;
  private _callbacks: Record<string, any>;

  constructor(private path: string) {
    //}, private channel: string) {
    // const fullPath: string = urljoin(path, channel);

    this.eventSource = new EventSource(path);
    // this.channel = channel;

    // open and error are reserved
    this.eventSource.addEventListener("open", this.onOpen.bind(this));
    this.eventSource.addEventListener("error", this.onError.bind(this));

    // close is a standard message, hijacked for our purposes
    this.eventSource.addEventListener("close", this.close.bind(this));

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
    this.eventSource?.close();
    this.eventSource = null;
    this._callbacks = {};
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

    // Only one listenter at a time.  If a second is needed, then change the code and document why.
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
}

export { Client };
