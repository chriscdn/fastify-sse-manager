(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.SSEClient = factory());
})(this, (function () { 'use strict';

  function normalize(strArray) {
    var resultArray = [];

    if (strArray.length === 0) {
      return '';
    }

    if (typeof strArray[0] !== 'string') {
      throw new TypeError('Url must be a string. Received ' + strArray[0]);
    } // If the first part is a plain protocol, we combine it with the next part.


    if (strArray[0].match(/^[^/:]+:\/*$/) && strArray.length > 1) {
      var first = strArray.shift();
      strArray[0] = first + strArray[0];
    } // There must be two or three slashes in the file protocol, two slashes in anything else.


    if (strArray[0].match(/^file:\/\/\//)) {
      strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, '$1:///');
    } else {
      strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, '$1://');
    }

    for (var i = 0; i < strArray.length; i++) {
      var component = strArray[i];

      if (typeof component !== 'string') {
        throw new TypeError('Url must be a string. Received ' + component);
      }

      if (component === '') {
        continue;
      }

      if (i > 0) {
        // Removing the starting slashes for each component but the first.
        component = component.replace(/^[\/]+/, '');
      }

      if (i < strArray.length - 1) {
        // Removing the ending slashes for each component but the last.
        component = component.replace(/[\/]+$/, '');
      } else {
        // For the last component we will combine multiple slashes to a single one.
        component = component.replace(/[\/]+$/, '/');
      }

      resultArray.push(component);
    }

    var str = resultArray.join('/'); // Each input component is now separated by a single slash except the possible first plain protocol part.
    // remove trailing slash before parameters or hash

    str = str.replace(/\/(\?|&|#[^!])/g, '$1'); // replace ? in parameters with &

    var parts = str.split('?');
    str = parts.shift() + (parts.length > 0 ? '?' : '') + parts.join('&');
    return str;
  }

  function urlJoin() {
    var input;

    if (typeof arguments[0] === 'object') {
      input = arguments[0];
    } else {
      input = [].slice.call(arguments);
    }

    return normalize(input);
  }

  class Client {
    constructor(path, channel) {
      const fullPath = urlJoin(path, channel);
      this.eventSource = new EventSource(fullPath);
      this.channel = channel; // open and error are reserved

      this.eventSource.addEventListener('open', this.onOpen.bind(this));
      this.eventSource.addEventListener('error', this.onError.bind(this)); // close is a standard message, hijacked for our purposes

      this.eventSource.addEventListener('close', this.close.bind(this)); // keep record of our callback functions to make them available to removeEventListener

      this._callbacks = {};
    }

    onOpen(event) {}

    onError(event) {}

    close(event) {
      this.eventSource.close();
      this.eventSource = null;
    }

    addEventListener(eventName, _callback) {
      const callback = event => {
        const type = event.type;
        const data = JSON.parse(event.data);

        _callback({
          type,
          data
        });
      }; // Only one listenter at a time.  If a second is needed, then change the code and document why.


      this.removeEventListener(eventName);
      this._callbacks[eventName] = callback;
      this.eventSource.addEventListener(eventName, callback);
    }

    removeEventListener(eventName) {
      const callback = this._callbacks[eventName];

      if (callback) {
        this.eventSource.removeEventListener(eventName, callback);
        delete this._callbacks[eventName];
      }
    }

  }

  return Client;

}));
//# sourceMappingURL=client.umd.js.map
