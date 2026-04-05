// src/client.ts
import urlJoin from "url-join";
var Client = class {
  eventSource;
  _callbacks;
  onOpenBound;
  onErrorBound;
  closeBound;
  constructor(path, channel) {
    const resolvedPath = channel ? urlJoin(path, channel) : path;
    this.eventSource = new EventSource(resolvedPath);
    this.onOpenBound = this.onOpen.bind(this);
    this.onErrorBound = this.onError.bind(this);
    this.closeBound = this.close.bind(this);
    this.eventSource.addEventListener("open", this.onOpenBound);
    this.eventSource.addEventListener("error", this.onErrorBound);
    this.eventSource.addEventListener("close", this.closeBound);
    this._callbacks = {};
  }
  onOpen(_event) {
  }
  onError(_event) {
  }
  close() {
    if (this.eventSource) {
      this.eventSource.removeEventListener("open", this.onOpenBound);
      this.eventSource.removeEventListener("error", this.onErrorBound);
      this.eventSource.removeEventListener("close", this.closeBound);
      this.removeAllEventListener();
      this.eventSource.close();
      this.eventSource = null;
    }
  }
  addEventListener(eventName, _callback) {
    const callback = (event) => {
      const data = JSON.parse(event.data);
      _callback({
        type: eventName,
        data
      });
    };
    this.removeEventListener(eventName);
    this._callbacks[eventName] = callback;
    this.eventSource?.addEventListener(eventName, callback);
    const stopListening = () => this.removeEventListener(eventName);
    return stopListening;
  }
  removeEventListener(eventName) {
    const callback = this._callbacks[eventName];
    if (callback) {
      this.eventSource?.removeEventListener(eventName, callback);
      delete this._callbacks[eventName];
    }
  }
  removeAllEventListener() {
    Object.keys(this._callbacks).forEach(
      (callbackName) => this.removeEventListener(callbackName)
    );
  }
};
export {
  Client
};
//# sourceMappingURL=client.js.map