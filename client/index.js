import urljoin from 'url-join'

class Client {
  constructor(path, channel) {
    const fullPath = urljoin(path, channel)

    this.eventSource = new EventSource(fullPath)
    this.channel = channel

    // open and error are reserved
    this.eventSource.addEventListener('open', this.onOpen.bind(this))
    this.eventSource.addEventListener('error', this.onError.bind(this))

    // close is a standard message, hijacked for our purposes
    this.eventSource.addEventListener('close', this.close.bind(this))

    // keep record of our callback functions to make them available to removeEventListener
    this._callbacks = {}
  }

  onOpen(event) {}
  onError(event) {}

  close(event) {
    this.eventSource.close()
    this.eventSource = null
  }

  addEventListener(eventName, _callback) {
    const callback = (event) => {
      const type = event.type
      const data = JSON.parse(event.data)

      _callback({
        type,
        data,
      })
    }

    // Only one listenter at a time.  If a second is needed, then change the code and document why.
    this.removeEventListener(eventName)

    this._callbacks[eventName] = callback
    this.eventSource.addEventListener(eventName, callback)
  }

  removeEventListener(eventName) {
    const callback = this._callbacks[eventName]
    if (callback) {
      this.eventSource.removeEventListener(eventName, callback)
      delete this._callbacks[eventName]
    }
  }
}

export default Client
