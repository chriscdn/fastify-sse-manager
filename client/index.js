import urljoin from 'url-join'

class Client {
  constructor(path, channel) {
    const fullPath = urljoin(path, channel)

    this.eventSource = new EventSource(fullPath)
    this.channel = channel

    // open and error are reserved
    this.eventSource.addEventListener('open', this.onOpen.bind(this))
    this.eventSource.addEventListener('error', this.onError.bind(this))

    // closed is a standard message, hijacked for our purposes
    this.eventSource.addEventListener('close', this.close.bind(this))
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

    this.eventSource.addEventListener(eventName, callback)
  }
}

export default Client
