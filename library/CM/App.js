/**
 * @class CM_App
 * @extends CM_Class_Abstract
 */
var CM_App = CM_Class_Abstract.extend({
  /** @type Object **/
  views: {},

  /** @type {Object|Null} **/
  viewer: null,

  /** @type Object **/
  options: {},

  ready: function() {
    this.dom.ready();
    this.window.ready();
    this.date.ready();
    this.template.ready();
    this.router.ready();
  },

  /**
   * @return {Number}
   */
  getSiteId: function() {
    return cm.options.site.type;
  },

  /**
   * @param {String|Null} [className]
   * @return {CM_Component_Abstract|Null}
   */
  findView: function(className) {
    if (!className) {
      var view = _.find(cm.views, function(view) {
        return !view.getParent();
      });
      if (!view) {
        cm.error.triggerThrow('Cannot find root component');
      }
      return view;
    }
    return _.find(this.views, function(view) {
      return view.hasClass(className);
    }) || null;
  },

  /**
   * @param {String|Null} [className]
   * @return CM_Component_Abstract[]
   */
  getViewList: function(className) {
    if (!className) {
      return this.views;
    }
    return _.filter(this.views, function(view) {
      return view.hasClass(className);
    });
  },

  /**
   * @return {CM_Layout_Abstract}
   */
  getLayout: function() {
    var layout = this.findView('CM_Layout_Abstract');
    if (!layout) {
      cm.error.triggerThrow('Cannot find layout');
    }
    return layout;
  },

  /**
   * @param {Number} min
   * @param {Number} max
   * @return {Number}
   */
  rand: function(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  },

  /**
   * Source: http://stackoverflow.com/a/2117523
   * @return {String}
   */
  getUuid: function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * @param {Number} delayMin
   * @param {Number} delayMax
   * @param {Function} execution fn({Function} retry, {Function} resetDelay)
   */
  retryDelayed: function(delayMin, delayMax, execution) {
    delayMin *= 1000;
    delayMax *= 1000;
    var delay = delayMin;
    var timeout;
    var resetDelay = function() {
      delay = delayMin;
      window.clearTimeout(timeout);
    };
    var retry = function() {
      var self = this;
      window.clearTimeout(timeout);
      timeout = window.setTimeout(function() {
        execution.call(self, retry, resetDelay);
        delay = Math.min(Math.max(delayMin, delay * 2), delayMax);
      }, delay);
    };
    execution.call(this, retry, resetDelay);
  },

  /**
   * @param {String} [path]
   * @param {Object} [params]
   * @param {Boolean} [relative]
   * @return {String}
   */
  getUrl: function(path, params, relative) {
    path = path || '';
    params = params || null;
    relative = relative || false;
    if (params) {
      path += '?' + jQuery.param(params, true);
    }
    if (!relative) {
      path = cm.options.url + path
    }
    return path;
  },

  /**
   * @param {String} path
   * @return {String}
   */
  getUrlStatic: function(path) {
    var url = '';
    if (cm.options.urlCdn) {
      url = cm.options.urlCdn + url;
    } else {
      url = cm.options.url + url;
    }

    url += '/static';
    if (path) {
      url += path + '?' + cm.options.deployVersion;
    }

    return url;
  },

  /**
   * @param {String} type
   * @param {String} path
   * @param {Object} [options]
   * @return {String}
   */
  getUrlResource: function(type, path, options) {
    options = _.defaults(options || {}, {
      'sameOrigin': false,
      'root': false
    });

    var url = '';
    if (!options['sameOrigin'] && cm.options.urlCdn) {
      url = cm.options.urlCdn + url;
    } else {
      url = cm.options.url + url;
    }

    if (type && path) {
      var urlParts = [];
      urlParts.push(type);
      if (cm.options.language) {
        urlParts.push(cm.options.language.abbreviation);
      }
      urlParts.push(cm.getSiteId());
      urlParts.push(cm.options.deployVersion);
      urlParts = urlParts.concat(path.split('/'));

      if (options['root']) {
        url += '/resource-' + urlParts.join('--');
      } else {
        url += '/' + urlParts.join('/');
      }
    }

    return url;
  },

  /**
   * @param {String} path
   * @return {String}
   */
  getUrlUserContent: function(path) {
    var matches = path.match(new RegExp('^([^/]+)/'));
    if (null === matches) {
      cm.error.triggerThrow('Cannot detect namespace for user-content file `' + path + '`.');
    }
    var namespace = matches[1];
    var urlList = cm.options.urlUserContentList;
    var url = _.has(urlList, namespace) ? urlList[namespace] : urlList['default'];
    return url + '/' + path;
  },

  /**
   * @param {String} type
   * @return {String}
   */
  getUrlAjax: function(type) {
    var path = '/' + type;
    if (cm.options.language) {
      path += '/' + cm.options.language.abbreviation;
    }
    path += '/' + this.getSiteId();
    return this.getUrl(path, null, true);
  },

  error: {
    _callbacks: {_all: []},
    /**
     * @param {String} msg
     * @param {String} [type]
     * @param {Boolean} [isPublic]
     */
    trigger: function(msg, type, isPublic) {
      for (var i = 0; i < this._callbacks._all.length; i++) {
        if (false === this._callbacks._all[i](msg, type, isPublic)) {
          return;
        }
      }
      if (this._callbacks[type]) {
        for (var j = 0; j < this._callbacks[type].length; j++) {
          if (false === this._callbacks[type][j](msg, type, isPublic)) {
            return;
          }
        }
      }
      if (isPublic) {
        cm.window.hint(msg);
      } else {
        if (type) {
          msg = type + ': ' + msg;
        }
        cm.window.hint(msg);
        if (window.console && console.error) {
          console.error('Error: ' + msg);
        }
      }
    },
    /**
     * @param {String} msg
     * @param {String} [type]
     * @param {Boolean} [isPublic]
     * @throws {String}
     */
    triggerThrow: function(msg, type, isPublic) {
      this.trigger(msg, type, isPublic);
      throw msg;
    },
    /**
     * @param {Function} callback fn(msg, type, isPublic)
     */
    bind: function(callback) {
      this.bindType('_all', callback);
    },
    /**
     * @param {String} type
     * @param {Function} callback fn(msg, type, isPublic)
     */
    bindType: function(type, callback) {
      if (!this._callbacks[type]) {
        this._callbacks[type] = [];
      }
      this._callbacks[type].push(callback);
    }
  },

  debug: {
    /**
     * @param {CM_View_Abstract} [view]
     * @param {Number} [indentation]
     */
    viewTree: function(view, indentation) {
      view = view || cm.findView();
      indentation = indentation || 0;
      console.log(new Array(indentation + 1).join("  ") + view.getClass() + " (", view.el, ")");
      _.each(view.getChildren(), function(child) {
        cm.debug.viewTree(child, indentation + 1);
      });
    },

    /**
     * @param message
     * @param [message2]
     * @param [message3]
     */
    log: function(message, message2, message3) {
      if (!cm.options.debug) {
        return;
      }
      var messages = _.toArray(arguments);
      messages.unshift('[CM]');
      if (window.console && window.console.log) {
        var log = window.console.log;
        if (typeof log == "object" && Function.prototype.bind) {
          log = Function.prototype.bind.call(console.log, console);
        }
        log.apply(console, messages);
      }
    }
  },

  dom: {
    _swfId: 0,
    ready: function() {
      if (window.addEventListener) {
        window.addEventListener('load', function() {
          new FastClick(document.body);
        }, false);
      }

      window.viewportUnitsBuggyfill.init();
    },
    /**
     * @param {jQuery} $dom
     */
    setup: function($dom) {
      $dom.find('.timeago').timeago();
      $dom.find('textarea.autosize, .autosize textarea').autosize({append: ''});
      $dom.find('.clipSlide').clipSlide();
      $dom.find('.showTooltip[title]').tooltip();
      $dom.find('.toggleNext').toggleNext();
      $dom.find('.tabs').tabs();
      $dom.find('.openx-ad:visible').openx();
      $dom.find('.epom-ad').epom();
      $dom.find('.fancySelect').fancySelect();
      this._setupLazyImages($dom);
    },

    /**
     * @param {jQuery} $dom
     */
    _setupLazyImages: function($dom) {
      $dom.find('.clipSlide').on('toggle.clipSlide', function() {
        $(this).find('img.lazy:gt(0)').unveil(600);
      });

      var $hiddenImageList = $();
      $dom.find('.clipSlide').each(function() {
        var $imageList = $(this).find('img.lazy:gt(0)');
        $hiddenImageList = $hiddenImageList.add($imageList);
      });

      $dom.find('img.lazy').not($hiddenImageList).unveil(600);
    },

    /**
     * @param {jQuery} $dom
     */
    teardown: function($dom) {
      $dom.find('.timeago').timeago('dispose');
      $dom.find('textarea.autosize, .autosize textarea').trigger('autosize.destroy');
      $dom.find('.showTooltip[title]').tooltip('destroy');
    },
    /**
     * @param {jQuery} $element
     * @param {Function} [success] fn(MediaElement, Element)
     * @param {Boolean} [preferPlugins]
     */
    setupVideo: function($element, success, preferPlugins) {
      var mode = 'auto';
      if (preferPlugins) {
        mode = 'auto_plugin';
      }

      $element.mediaelementplayer({
        flashName: cm.getUrlResource('layout', 'swf/flashmediaelement.swf'),
        silverlightName: cm.getUrlResource('layout', 'swf/silverlightmediaelement.xap'),
        videoWidth: '100%',
        videoHeight: '100%',
        defaultVideoWidth: '100%',
        defaultVideoHeight: '100%',
        mode: mode,
        success: function(mediaElement, domObject) {
          var mediaElementMuted = cm.storage.get('mediaElement-muted');
          var mediaElementVolume = cm.storage.get('mediaElement-volume');
          if (null !== mediaElementMuted) {
            mediaElement.setMuted(mediaElementMuted);
          }
          if (null !== mediaElementVolume) {
            mediaElement.setVolume(mediaElementVolume);
          }
          mediaElement.addEventListener("volumechange", function() {
            cm.storage.set('mediaElement-volume', mediaElement.volume);
            cm.storage.set('mediaElement-muted', mediaElement.muted.valueOf());
          });
          if (success) {
            success(mediaElement, domObject);
          }
        }
      });
    }
  },

  string: {
    padLeft: function(str, length, character) {
      character = character || ' ';
      var string = String(str);
      return new Array(length - string.length + 1).join(character) + string;
    }
  },

  date: {
    ready: function() {
      $.timeago.settings.allowFuture = true;
      $.timeago.settings.strings = {
        prefixAgo: cm.language.get('.date.timeago.prefixAgo', {count: '%d'}),
        prefixFromNow: cm.language.get('.date.timeago.prefixFromNow', {count: '%d'}),
        suffixAgo: cm.language.get('.date.timeago.suffixAgo', {count: '%d'}),
        suffixFromNow: cm.language.get('.date.timeago.suffixFromNow', {count: '%d'}),
        seconds: cm.language.get('.date.timeago.seconds', {count: '%d'}),
        minute: cm.language.get('.date.timeago.minute', {count: '%d'}),
        minutes: cm.language.get('.date.timeago.minutes', {count: '%d'}),
        hour: cm.language.get('.date.timeago.hour', {count: '%d'}),
        hours: cm.language.get('.date.timeago.hours', {count: '%d'}),
        day: cm.language.get('.date.timeago.day', {count: '%d'}),
        days: cm.language.get('.date.timeago.days', {count: '%d'}),
        month: cm.language.get('.date.timeago.month', {count: '%d'}),
        months: cm.language.get('.date.timeago.months', {count: '%d'}),
        year: cm.language.get('.date.timeago.year', {count: '%d'}),
        years: cm.language.get('.date.timeago.years', {count: '%d'}),
        wordSeparator: " ",
        numbers: []
      };
    },
    /**
     * @return {Number} Unix-timestamp
     */
    timestamp: function() {
      return (new Date()).getTime();
    },
    /**
     * @param {Date} date
     * @return {String}
     */
    iso8601: function(date) {
      return date.getUTCFullYear() + '-' + cm.string.padLeft(date.getUTCMonth() + 1, 2, '0') + '-' + cm.string.padLeft(date.getUTCDate(), 2, '0') + 'T' + cm.string.padLeft(date.getUTCHours(), 2, '0') + ':' + cm.string.padLeft(date.getUTCMinutes(), 2, '0') + ':' + cm.string.padLeft(date.getUTCSeconds(), 2, '0') + '.' + cm.string.padLeft(date.getUTCMilliseconds(), 3, '0') + 'Z';
    },
    /**
     * @param {Number} [timestamp]
     * @return {jQuery}
     */
    $timeago: function(timestamp) {
      return $(this.timeago(timestamp)).timeago();
    },
    /**
     * @param {Number} [timestamp]
     * @param {String} [cssClass]
     * @return {jQuery}
     */
    timeago: function(timestamp, cssClass) {
      var date;
      if (timestamp) {
        date = new Date(timestamp * 1000);
      } else {
        date = new Date();
      }
      var print = date.toLocaleString();
      var iso8601 = this.iso8601(date);
      cssClass += ' timeago';
      return '<time datetime="' + iso8601 + '" class="' + cssClass + '">' + print + '</time>';
    }
  },

  language: {
    _keys: {},

    /**
     * @param {String} key
     * @param {String} value
     */
    set: function(key, value) {
      this._keys[key] = value;
    },

    /**
     * @param {Object} translations
     */
    setAll: function(translations) {
      this._keys = translations;
    },

    /**
     * @param {String} key
     * @param {Object} [variables]
     */
    get: function(key, variables) {
      if (this._keys[key] === undefined) {
        cm.rpc('CM_Model_Language.requestTranslationJs', {languageKey: key});
        this.set(key, key);
      }
      var value = this._keys[key];
      if (variables) {
        _.each(variables, function(variableValue, variableKey) {
          value = value.replace('{$' + variableKey + '}', variableValue);
        });
      }
      return value;
    }
  },

  cache: {
    _values: {},

    /**
     * @param {String} key
     * @param {Function} getter
     * @param {Object} [context]
     * @return {*}
     */
    get: function(key, getter, context) {
      if (!(key in this._values)) {
        this._values[key] = getter.call(context);
      }
      return this._values[key];
    }
  },

  ui: {
    /**
     * @param {String} question
     * @param {Function} callback
     * @param {Object} [context]
     */
    confirm: function(question, callback, context) {
      var $ok = $('<input type="button" class="button button-default" />').val(cm.language.get('Ok'));
      var $cancel = $('<input type="button" class="button button-default" />').val(cm.language.get('Cancel'));
      var $html = $('<div class="box"><div class="box-header nowrap"><h2></h2></div><div class="box-body"></div><div class="box-footer"></div></div>');
      $html.find('.box-header h2').text(cm.language.get('Confirmation'));
      $html.find('.box-body').text(question);
      $html.find('.box-footer').append($ok, $cancel);

      $html.floatOut();
      $ok.click(function() {
        $html.floatIn();
        callback.call(context);
      });
      $cancel.click(function() {
        $html.floatIn();
      });
      $ok.focus();
    }
  },

  template: {
    ready: function() {
      _.templateSettings = {
        evaluate: /\[\[(.+?)\]\]/g,
        interpolate: /\[\[=(.+?)\]\]/g,
        escape: /\[\[-(.+?)\]\]/g
      };
    },

    /**
     * @param {String} template
     * @param {Object} variables
     * @return {jQuery}
     */
    render: function(template, variables) {
      var $output = $(this.renderHtml(template, variables));
      cm.dom.setup($output);
      return $output;
    },

    /**
     * @param {String} template
     * @param {Object} variables
     * @return {String}
     */
    renderHtml: function(template, variables) {
      var compiled = _.template(template);
      return compiled(variables).replace(/^\s+|\s+$/g, '');
    }
  },

  window: {
    /** @var {String|Null} */
    _id: null,

    /** @var {Boolean} */
    _hasFocus: true,

    /** @var {jQuery|Null} */
    _$hidden: null,

    /**
     * @returns {String}
     */
    getId: function() {
      if (!this._id) {
        this._id = cm.getUuid();
      }
      return this._id;
    },

    focus: {
      /**
       * @return {Array}
       */
      _get: function() {
        var windows = cm.storage.get('focusWindows');
        if (windows === null) {
          windows = [];
        }
        return windows;
      },
      /**
       * @param {Array} focusWindows
       */
      _set: function(focusWindows) {
        cm.storage.set('focusWindows', focusWindows);
      },
      /**
       * @param {String} uuid
       */
      add: function(uuid) {
        if (this.isLast(uuid)) {
          return;
        }
        this.remove(uuid);
        var windows = this._get();
        windows.push(uuid);
        this._set(windows);
      },
      /**
       * @param {String} uuid
       */
      remove: function(uuid) {
        var windows = this._get();
        var index = windows.indexOf(uuid);
        if (index !== -1) {
          windows.splice(index, 1);
          this._set(windows);
        }
      },
      /**
       * @param {String} uuid
       * @returns {Boolean}
       */
      isLast: function(uuid) {
        var windows = this._get();
        var index = windows.indexOf(uuid);
        return index !== -1 && index === windows.length - 1;
      }
    },

    ready: function() {
      var handler = this;
      handler.focus.add(handler.getId());
      $(window).on('beforeunload', function() {
        handler.focus.remove(handler.getId());
      });
      $(window).focus(function() {
        handler.focus.add(handler.getId());
        handler._hasFocus = true;
      }).blur(function() {
        handler._hasFocus = false;
      });
      this.title.ready();
    },

    /**
     * @return {Boolean}
     */
    isLastFocus: function() {
      return this.focus.isLast(this.getId());
    },

    /**
     * @return {Boolean}
     */
    hasFocus: function() {
      return this._hasFocus;
    },

    /**
     * @param {String|jQuery} html
     */
    appendHidden: function(html) {
      if (!this._$hidden) {
        this._$hidden = $('<div style="display:none;" />').appendTo('body');
      }
      this._$hidden.append(html);
    },

    /**
     * @param {Element} element
     * @return Boolean
     */
    isHidden: function(element) {
      if (!this._$hidden) {
        return false;
      }
      return $.contains(this._$hidden[0], element);
    },

    /**
     * @param {String} content
     */
    hint: function(content) {
      $.windowHint(content);
    },

    fastScroll: {
      /** @var {FastScroll|Null} */
      _instance: null,

      enable: function() {
        if (!this._instance) {
          this._instance = new FastScroll();
        }
      },

      disable: function() {
        if (this._instance) {
          this._instance.destroy();
          this._instance = null;
        }
      }
    },

    title: {
      /** @var {String|null} */
      _prefix: null,
      /** @var {String} */
      _text: '',

      ready: function() {
        this.setText(document.title);
      },

      /**
       * @param {String|null} prefix
       */
      setPrefix: function(prefix) {
        this._prefix = prefix;
        this._update();
      },

      /**
       * @param {String} text
       */
      setText: function(text) {
        this._text = text;
        this._update();
      },

      _update: function() {
        var title = '';
        if (this._prefix) {
          title += this._prefix + ' ';
        }
        if (this._text) {
          title += this._text;
        }
        document.title = title;
      }
    }
  },

  storage: {
    /**
     * @param {String} key
     * @param {Object} value
     */
    set: function(key, value) {
      try {
        localStorage.setItem(cm.getSiteId() + ':' + key, JSON.stringify(value));
      } catch (e) {
        // iOS5 Private Browsing mode which throws QUOTA_EXCEEDED_ERR: DOM Exception 22
      }
    },

    /**
     * @param {String} key
     * @return {*|Null}
     */
    get: function(key) {
      var value = localStorage.getItem(cm.getSiteId() + ':' + key);
      if (value === null) {
        // See: https://code.google.com/p/android/issues/detail?id=11973
        return null;
      }
      return JSON.parse(value);
    },

    /**
     * @param {String} key
     */
    del: function(key) {
      localStorage.removeItem(cm.getSiteId() + ':' + key);
    }
  },

  /**
   * @param {String} type
   * @param {Object} data
   * @param {Object} [callbacks]
   * @return jqXHR
   */
  ajax: function(type, data, callbacks) {
    callbacks = callbacks || {};
    var url = this.getUrlAjax(type);
    var errorHandler = function(msg, type, isPublic, callback) {
      if (!callback || callback(msg, type, isPublic) !== false) {
        cm.error.trigger(msg, type, isPublic);
      }
    };
    var jqXHR = $.ajax(url, {
      data: JSON.stringify(data),
      type: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      cache: false
    });
    jqXHR.retry({times: 3, statusCodes: [405, 500, 503, 504]}).done(function(response) {
      if (response.error) {
        errorHandler(response.error.msg, response.error.type, response.error.isPublic, callbacks.error);
      } else if (response.success) {
        if (callbacks.success) {
          callbacks.success(response.success);
        }
      }
    }).fail(function(xhr, textStatus) {
      if (xhr.status === 0) {
        return; // Ignore interrupted ajax-request caused by leaving a page
      }

      var msg = cm.language.get('An unexpected connection problem occurred.');
      if (cm.options.debug) {
        msg = xhr.responseText || textStatus;
      }
      errorHandler(msg, null, false, callbacks.error);
    }).always(function() {
      if (callbacks.complete) {
        callbacks.complete();
      }
    });

    return jqXHR;
  },

  /**
   * @param {String} methodName
   * @param {Object} params
   * @param {Object|Null} [callbacks]
   * @return jqXHR
   */
  rpc: function(methodName, params, callbacks) {
    callbacks = callbacks || {};
    return this.ajax('rpc', {method: methodName, params: params}, {
      success: function(response) {
        if (typeof(response.result) === 'undefined') {
          cm.error.trigger('RPC response has undefined result');
        }
        if (callbacks.success) {
          callbacks.success(response.result);
        }
      },
      error: callbacks.error,
      complete: callbacks.complete
    });
  },

  stream: {
    /** @type {CM_MessageStream_Adapter_Abstract} */
    _adapter: null,

    /** @type {Object} */
    _channelDispatchers: {},

    /**
     * @param {String} channelKey
     * @param {Number} channelType
     * @param {String} namespace
     * @param {Function} callback fn(array data)
     * @param {Object} [context]
     * @param {Boolean} [allowClientMessage]
     */
    bind: function(channelKey, channelType, namespace, callback, context, allowClientMessage) {
      var channel = channelKey + ':' + channelType;
      if (!cm.options.stream.enabled) {
        return;
      }
      if (!channelKey || !channelType) {
        cm.error.triggerThrow('No channel provided');
      }
      if (!this._channelDispatchers[channel]) {
        this._subscribe(channel);
      }
      this._channelDispatchers[channel].on(this._getEventNames(namespace, allowClientMessage), callback, context);
    },

    /**
     * @param {String} channelKey
     * @param {Number} channelType
     * @param {String} [namespace]
     * @param {Function} [callback]
     * @param {Object} [context]
     */
    unbind: function(channelKey, channelType, namespace, callback, context) {
      var channel = channelKey + ':' + channelType;
      if (!this._channelDispatchers[channel]) {
        return;
      }
      if (!channelKey || !channelType) {
        cm.error.triggerThrow('No channel provided');
      }
      this._channelDispatchers[channel].off(this._getEventNames(namespace, true), callback, context);
      if (this._getBindCount(channel) === 0) {
        this._unsubscribe(channel);
      }
    },

    /**
     * @param {String} channelKey
     * @param {Number} channelType
     * @param {String} event
     * @param {Object} data
     */
    publish: function(channelKey, channelType, event, data) {
      var channel = channelKey + ':' + channelType;
      this._getAdapter().publish(channel, event, data);
    },

    /**
     * @param {String} [namespace]
     * @param {Boolean} [allowClientMessage]
     */
    _getEventNames: function(namespace, allowClientMessage) {
      var eventName = namespace;
      if (namespace && allowClientMessage) {
        eventName += ' client-' + namespace;
      }
      return eventName;
    },

    /**
     * @param {String} channel
     * @return {Number}
     */
    _getBindCount: function(channel) {
      if (!this._channelDispatchers[channel] || !this._channelDispatchers[channel]._events) {
        return 0;
      }
      return _.size(this._channelDispatchers[channel]._events);
    },

    /**
     * @return {CM_MessageStream_Adapter_Abstract}
     */
    _getAdapter: function() {
      if (!this._adapter) {
        this._adapter = new window[cm.options.stream.adapter](cm.options.stream.options);
      }
      return this._adapter;
    },

    /**
     * @param {String} channel
     */
    _subscribe: function(channel) {
      var handler = this;
      this._channelDispatchers[channel] = _.clone(Backbone.Events);
      this._getAdapter().subscribe(channel, {sessionId: $.cookie('sessionId')}, function(event, data) {
        if (handler._channelDispatchers[channel]) {
          handler._channelDispatchers[channel].trigger(event, data);
          cm.debug.log('Stream channel (' + channel + '): event `' + event + '`: ', data);
        }
      });
      cm.debug.log('Stream channel (' + channel + '): subscribe');
    },

    /**
     * @param {String} channel
     */
    _unsubscribe: function(channel) {
      if (this._channelDispatchers[channel]) {
        delete this._channelDispatchers[channel];
      }
      this._adapter.unsubscribe(channel);
      cm.debug.log('Stream channel (' + channel + '): unsubscribe');
    }
  },

  viewEvents: {
    /**
     * @type {Object}
     */
    _dispatcher: _.clone(Backbone.Events),

    /**
     * @param {CM_View_Abstract} view
     * @param {String} childViewName
     * @param {String} eventName
     * @return {String}
     */
    _getEventName: function(view, childViewName, eventName) {
      return view.getAutoId() + ':' + childViewName + ':' + eventName;
    },

    /**
     * @param {CM_View_Abstract} view
     * @param {String} childViewName
     * @param {String} eventName
     * @param {Function} callback fn(CM_View_Abstract view, array data)
     * @param {Object} [context]
     */
    bind: function(view, childViewName, eventName, callback, context) {
      this._dispatcher.on(this._getEventName(view, childViewName, eventName), callback, context);
    },

    /**
     * @param {CM_View_Abstract} view
     * @param {String} childViewName
     * @param {String} eventName
     * @param {Function} callback fn(CM_View_Abstract view, array data)
     * @param {Object} [context]
     */
    unbind: function(view, childViewName, eventName, callback, context) {
      this._dispatcher.off(this._getEventName(view, childViewName, eventName), callback, context);
    },

    /**
     * @param {CM_View_Abstract} view
     * @param {String} eventName
     * @param {*} data
     */
    trigger: function(view, eventName, data) {
      var parent = view;
      while (parent = parent.getParent()) {
        this._dispatcher.trigger(this._getEventName(parent, view.getClass(), eventName), view, data);
      }
    }
  },

  event: {
    /**
     * @type {Backbone.Events}
     */
    _dispatcher: _.clone(Backbone.Events),

    /**
     * @param {String} eventName
     * @param {Function} callback fn(Object data)
     * @param {Object} [context]
     */
    bind: function(eventName, callback, context) {
      this._dispatcher.on(eventName, callback, context);
    },

    /**
     * @param {String} eventName
     * @param {Function} callback fn(Object data)
     * @param {Object} [context]
     */
    unbind: function(eventName, callback, context) {
      this._dispatcher.off(eventName, callback, context);
    },

    /**
     * @param {String} eventName
     * @param {Object} [data]
     */
    trigger: function(eventName, data) {
      this._dispatcher.trigger(eventName, data);
    }
  },

  model: {
    types: {}
  },

  action: {
    verbs: {},
    types: {},

    /**
     * @param {Number} actionVerb
     * @param {Number} actionType
     * @param {String} channelKey
     * @param {Number} channelType
     * @param {Function} callback fn(CM_Action_Abstract action, CM_Model_Abstract model, array data)
     * @param {Object} [context]
     */
    bind: function(actionVerb, actionType, channelKey, channelType, callback, context) {
      cm.stream.bind(channelKey, channelType, 'CM_Action_Abstract:' + actionVerb + ':' + actionType, callback, context);
    },
    /**
     * @param {Number} actionVerb
     * @param {Number} actionType
     * @param {String} channelKey
     * @param {Number} channelType
     * @param {Function} [callback]
     * @param {Object} [context]
     */
    unbind: function(actionVerb, actionType, channelKey, channelType, callback, context) {
      cm.stream.unbind(channelKey, channelType, 'CM_Action_Abstract:' + actionVerb + ':' + actionType, callback, context);
    }
  },

  keyCode: {
    ALT: 18,
    BACKSPACE: 8,
    CAPS_LOCK: 20,
    COMMA: 188,
    COMMAND: 91,
    COMMAND_LEFT: 91,
    COMMAND_RIGHT: 93,
    CONTROL: 17,
    DELETE: 46,
    DOWN: 40,
    END: 35,
    ENTER: 13,
    ESCAPE: 27,
    HOME: 36,
    INSERT: 45,
    LEFT: 37,
    MENU: 93,
    NUMPAD_ADD: 107,
    NUMPAD_DECIMAL: 110,
    NUMPAD_DIVIDE: 111,
    NUMPAD_ENTER: 108,
    NUMPAD_MULTIPLY: 106,
    NUMPAD_SUBTRACT: 109,
    PAGE_DOWN: 34,
    PAGE_UP: 33,
    PERIOD: 190,
    RIGHT: 39,
    SHIFT: 16,
    SPACE: 32,
    TAB: 9,
    UP: 38,
    WINDOWS: 91
  },

  router: {
    /** @type {String|Null} */
    hrefInitialIgnore: null,

    ready: function() {
      var router = this;
      this.hrefInitialIgnore = location.href;

      $(window).on('popstate', function() {
        // this `if` fixes double fire of `popstate` event on the initial page.
        if (router.hrefInitialIgnore === location.href) {
          router.hrefInitialIgnore = null;
          return;
        }
        router.hrefInitialIgnore = null;
        router._handleLocationChange(router._getFragment());
      });

      var urlBase = cm.getUrl();
      $(document).on('click', 'a[href]:not([data-router-disabled=true])', function(event) {
        var metaPressed = (event.ctrlKey || event.metaKey);
        var partOfUrlBase = 0 === this.href.indexOf(urlBase);
        if (!metaPressed && partOfUrlBase) {
          var fragment = this.href.substr(urlBase.length);
          var forceReload = $(this).data('force-reload');
          router.route(fragment, forceReload);
          event.preventDefault();
        }
      });
    },

    /**
     * @param {String} url
     * @param {Boolean|Null} [forceReload]
     * @param {Boolean|Null} [replaceState]
     */
    route: function(url, forceReload, replaceState) {
      forceReload = forceReload || false;
      replaceState = replaceState || false;
      var urlBase = cm.getUrl();
      var fragment = url;
      if ('/' == url.charAt(0)) {
        url = urlBase + fragment;
      } else {
        fragment = url.substr(urlBase.length);
      }
      if (forceReload || 0 !== url.indexOf(urlBase)) {
        window.location.assign(url);
        return;
      }
      if (fragment !== this._getFragment()) {
        if (replaceState) {
          this.replaceState(fragment);
        } else {
          this.pushState(fragment);
        }
      }
      this._handleLocationChange(fragment);
    },

    /**
     * @param {String|Null} [url] Absolute or relative URL
     */
    pushState: function(url) {
      this.hrefInitialIgnore = null;
      window.history.pushState(null, null, url);
    },

    /**
     * @param {String|Null} [url] Absolute or relative URL
     */
    replaceState: function(url) {
      this.hrefInitialIgnore = null;
      window.history.replaceState(null, null, url);
    },

    /**
     * @returns string
     */
    _getFragment: function() {
      var location = window.location;
      return location.pathname + location.search + location.hash;
    },

    /**
     * @param {String} fragment
     * @returns Location
     */
    _getLocationByFragment: function(fragment) {
      var location = document.createElement('a');
      if (fragment) {
        location.href = fragment;
      }
      return location;
    },

    /**
     * @param {String} fragment
     */
    _handleLocationChange: function(fragment) {
      var paramsStateNext = null;
      var pageCurrent = cm.getLayout().findPage();

      if (pageCurrent && pageCurrent.hasStateParams()) {
        var locationCurrent = this._getLocationByFragment(pageCurrent.getFragment());
        var locationNext = this._getLocationByFragment(fragment);

        if (locationCurrent.pathname === locationNext.pathname) {
          var paramsCurrent = queryString.parse(locationCurrent.search);
          var paramsNext = queryString.parse(locationNext.search);

          var stateParamNames = pageCurrent.getStateParams();

          var paramsNonStateCurrent = _.pick(paramsCurrent, _.difference(_.keys(paramsCurrent), stateParamNames));
          var paramsNonStateNext = _.pick(paramsNext, _.difference(_.keys(paramsNext), stateParamNames));

          if (_.isEqual(paramsNonStateCurrent, paramsNonStateNext)) {
            paramsStateNext = _.pick(paramsNext, _.intersection(_.keys(paramsNext), stateParamNames));
          }
        }
      }

      if (paramsStateNext) {
        if (false !== cm.getLayout().getPage().routeToState(paramsStateNext, fragment)) {
          return;
        }
      }
      cm.getLayout().loadPage(fragment);
    }
  }
});
