(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global["sse-client"] = factory());
})(this, (function () { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	var urlJoin = {exports: {}};

	(function (module) {
	  (function (name, context, definition) {
	    if (module.exports) module.exports = definition();else context[name] = definition();
	  })('urljoin', commonjsGlobal, function () {
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

	    return function () {
	      var input;

	      if (typeof arguments[0] === 'object') {
	        input = arguments[0];
	      } else {
	        input = [].slice.call(arguments);
	      }

	      return normalize(input);
	    };
	  });
	})(urlJoin);

	var urljoin = urlJoin.exports;

	class Client {
	  constructor(path, channel) {
	    const fullPath = urljoin(path, channel);
	    this.eventSource = new EventSource(fullPath);
	    this.channel = channel; // open and error are reserved

	    this.eventSource.addEventListener('open', this.onOpen.bind(this));
	    this.eventSource.addEventListener('error', this.onError.bind(this)); // close is a standard message, hijacked for our purposes

	    this.eventSource.addEventListener('close', this.close.bind(this));
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
	    };

	    this.eventSource.addEventListener(eventName, callback);
	  }

	}

	return Client;

}));
//# sourceMappingURL=client.umd.js.map
