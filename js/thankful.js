/**
 * The Thankful button.
 * (c) 2014 Fat Panda, LLC. All rights reserved.
 * @author Aaron Collegeman aaron@collegeman.net
 * @version 0.0.0
 */
!function(W, D) {

  'use strict';


  /**
   * The iframe that hosts the modal.
   */
  var iframe,

  /**
   * The onion skin element
   */
      onion,

  /**
   * The loading icon.
   */
      loading,


  /**
   * For caching params; see getParams()
   */
      params;



  /**
   * Our host-side API.
   */
  W.Thankful = {

    /**
     * Display the modal.
     */
    show: function() {

      var body = D.getElementsByTagName('body')[0];

      loading = D.createElement('img');
      loading.setAttribute('src', 'img/loading.png');
      loading.setAttribute('style', 'display:block; position: absolute; width:58px; height:51px; top:50%; left:50%; margin-top:-25px; margin-left:-29px;');

      onion = D.createElement('div');
      onion.setAttribute('style', 'display:block; position: fixed; top:0; left:0; background-color: rgba(44, 62, 80, 0.50); width:100%; height:100%;');

      iframe = D.createElement('iframe');
      iframe.setAttribute('src', 'thankful.html?_host=' + encodeURIComponent(document.location.toString()) + '&t=' + Math.random().toString());
      iframe.setAttribute('allowTransparency', 'true');
      iframe.setAttribute('style', 'display:none; background:transparent; position:fixed; top:0; left:0; width:100%; height:100%;');

      onion.appendChild(loading);
      body.appendChild(onion);
      body.appendChild(iframe);

      // TODO: lock scrolling in host window

      on(W, 'message', onHostReceiveMessage);

    },

    /**
     * Destory the modal.
     */
    destroy: function() {

      off(W, 'message', onHostReceiveMessage);
      loading.remove();
      iframe.remove();
      onion.remove();

    }

  };

  /**
   * Process the message event
   * @param Event
   */
  function onHostReceiveMessage(e) {
    // TODO: validate origin

    if (e.data === 'init') {
      loading.style.display = 'none';
      iframe.style.display = 'block';

    } else if (e.data === 'destroy') {
      Thankful.destroy();

    }


  }

  /**
   * @return Object The query parameters for the current page
   */
  function getParams() {
    return params ? params : ( params = fromQueryString(document.location.search) );
  }

  /**
   * Send a message to the host page
   * @param String
   */
  function sendMessage(msg) {
    if (getParams()._host) {
      parent.postMessage(msg, getParams()._host);
    }
  }

  /**
   * Initialize modal view.
   */
  function initModal() {

    sendMessage('init');

    

  }

  /**
   * @param String Attribute to match
   * @return All elements with matching attribute
   * @see http://stackoverflow.com/questions/9496427/can-i-get-elements-by-attribute-selector-when-queryselectorall-is-not-available
   */
  function getAllThankfulElements() {
    var matchingElements = [],
        allElements = D.getElementsByTagName('*'),
        attributeValue = null;

    for (var i = 0, n = allElements.length; i < n; i++) {
      if (attributeValue = allElements[i].getAttribute('data-is')) {
        if (attributeValue.toLowerCase() === 'thankful') {
          matchingElements.push(allElements[i]);
        }
      }
    }
    return matchingElements;
  }

  /**
   * Cross-platform event binding utility.
   * @param DOM element
   * @param String The event name to bind
   * @param The callback function
   * @see http://stackoverflow.com/questions/854772/onclick-without-jquery
   */
  function on(el, type, callback) {
    if (!el || !type) {
      return false;
    }
    if (el.addEventListener) {
      el.addEventListener(type, callback, false);
    } else if (el.attachEvent) {
      el.attachEvent('on' + type, function() {
        return callback.apply(el, [W.event]);
      });
    }
  }

  /**
   * Cross-platform event unbinding utility.
   * @param DOM element
   * @param String The event name to unbind
   * @param The callback function
   * @see http://www.javascripter.net/faq/removeeventlistenerdetachevent.htm
   */
  function off(el, type, callback) {
    if (el.removeEventListener) {
      el.removeEventListener(type, callback, false);
    } else if (elem.detachEvent) {
      el.detachEvent('on' + type, callback);
    }
  }

  /**
   * Cancel the bubbling of an event.
   * @param Event or null (window.event will be used instead)
   * @see http://www.javascripter.net/faq/canceleventbubbling.htm
   */
  function preventDefault(e) {
    e = e ? e : W.event;
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.cancelBubble = true;
  }

  /**
   * Window onload handler.
   */
  function onLoad() {
    var thankful = getAllThankfulElements(),
        body = D.getElementsByTagName('body')[0];

    // if loaded by our modal, init the modal
    if ((body.getAttribute('data-thankful') || '').toLowerCase() === 'modal') {
      initModal();

    // otherwise, look for *[data-is="thankful"] and add click handlers
    } else {
      for(var i in thankful) {
        var el = thankful[i];
        on(el, 'click', function(e) {
          Thankful.show();
          preventDefault(e);
        });
      }
    }
  }

  /**
   * @see https://github.com/andrewplummer/Sugar/blob/master/lib/object.js
   */
  function setParamsObject(obj, param, value, castBoolean) {
    var reg = /^(.+?)(\[.*\])$/, paramIsArray, match, allKeys, key;
    if(match = param.match(reg)) {
      key = match[1];
      allKeys = match[2].replace(/^\[|\]$/g, '').split('][');
      allKeys.forEach(function(k) {
        paramIsArray = !k || k.match(/^\d+$/);
        if(!key && isArray(obj)) key = obj.length;
        if(!hasOwnProperty(obj, key)) {
          obj[key] = paramIsArray ? [] : {};
        }
        obj = obj[key];
        key = k;
      });
      if(!key && paramIsArray) key = obj.length.toString();
      setParamsObject(obj, key, value, castBoolean);
    } else if(castBoolean && value === 'true') {
      obj[param] = true;
    } else if(castBoolean && value === 'false') {
      obj[param] = false;
    } else {
      obj[param] = value;
    }
  }

  /**
   * Convert the given query string into an Object.
   * @param String The query string
   * @param bool Pass true to force the casting of values to boolean (?)
   * @return Object
   * @see https://github.com/andrewplummer/Sugar/blob/master/lib/object.js
   */
  function fromQueryString(str, castBoolean) {
    var result = {}, split;
    str = str && str.toString ? str.toString() : '';
    str.replace(/^.*?\?/, '').split('&').forEach(function(p) {
      var split = p.split('=');
      if(split.length !== 2) return;
      setParamsObject(result, split[0], decodeURIComponent(split[1]), castBoolean);
    });
    return result;
  }

  function toQueryString(obj, namespace) {
    return objectToQueryString(namespace, obj);
  }

  /**
   * Convert the given object to a query string
   * @param String namespace
   * @param Object
   * @return String
   * @see https://github.com/andrewplummer/Sugar/blob/master/lib/object.js
   */
  function objectToQueryString(base, obj) {
    var tmp;
    // If a custom toString exists bail here and use that instead
    if(isArray(obj) || (isObjectType(obj) && obj.toString === internalToString)) {
      tmp = [];
      iterateOverObject(obj, function(key, value) {
        if(base) {
          key = base + '[' + key + ']';
        }
        tmp.push(objectToQueryString(key, value));
      });
      return tmp.join('&');
    } else {
      if(!base) return '';
      return sanitizeURIComponent(base) + '=' + (isDate(obj) ? obj.getTime() : sanitizeURIComponent(obj));
    }
  }

  /**
   * Santize the given object
   * @param Object
   * @return String
   */
  function sanitizeURIComponent(obj) {
    // undefined, null, and NaN are represented as a blank string,
    // while false and 0 are stringified. "+" is allowed in query string
    return !obj && obj !== false && obj !== 0 ? '' : encodeURIComponent(obj).replace(/%20/g, '+');
  }

  // bootstrap our init function
  on(W, 'load', onLoad);

}(window, document);
