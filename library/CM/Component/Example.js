/**
 * @class CM_Component_Example
 * @extends CM_Component_Abstract
 */
var CM_Component_Example = CM_Component_Abstract.extend({
  _class: 'CM_Component_Example',

  uname: null,
  profile: null,
  pingCount: 0,

  events: {
    'click .reloadComponent': 'reloadChinese',
    'click .popoutComponent': 'popOut',
    'click .popinComponent': 'popIn',
    'click .multiLevelPopoutComponent': 'multiLevelPopout',
    'click .loadComponent': 'loadExample',
    'click .loadComponent_callback': 'loadExampleInline',
    'click .removeComponent': 'myRemove',
    'click .callRpcTime': 'callRpc',
    'click .callAjaxTest': 'callAjaxTest',
    'click .throwError_500_text_callback': 'error_500_text_callback',
    'click .throwError_599_text': 'error_599_text',
    'click .throwError_CM_Exception_public_callback': 'error_CM_Exception_public_callback',
    'click .throwError_CM_Exception_public': 'error_CM_Exception_public',
    'click .throwError_CM_Exception': 'error_CM_Exception',
    'click .throwError_CM_Exception_AuthRequired_public_callback': 'error_CM_Exception_AuthRequired_public_callback',
    'click .throwError_CM_Exception_AuthRequired_public': 'error_CM_Exception_AuthRequired_public',
    'click .throwError_CM_Exception_AuthRequired': 'error_CM_Exception_AuthRequired',
    'click .callAjaxPing': 'ping',
    'click .confirmAction': 'confirmAction',
    'click .toggleWindow': function(e) {
      var $opener = $(e.currentTarget);
      this.toggleWindow($opener);
    }
  },

  streams: {
    'ping': function(response) {
      this.$('.stream .output').append(response.number + ': ' + response.message + '<br />').scrollBottom();
    }
  },

  ready: function() {
    this.message("Component ready, uname: " + this.uname);
  },

  multiLevelPopout: function() {
    var applyFloatbox = function($el) {
      var $popout = $el.children('.innerPopoutComponent');
      var $popin = $el.children('.innerPopinComponent');
      var $subpopup = $el.children('.innerPopup');

      $el.hide();
      $subpopup.hide();
      $popout.hide();

      if (0 !== $subpopup.length) {
        $popout.show();
        $popout.on('click', function() {
          applyFloatbox($subpopup);
          $subpopup.floatOut();
        });
      }

      $popin.on('click', function() {
        $el.floatIn();
      });

      $el.on('floatbox-open', function(event) {
        event.stopPropagation();
        $el.show();
      });

      $el.on('floatbox-close', function(event) {
        event.stopPropagation();
        $popout.off('click');
        $popin.off('click');
        $el.off('floatbox-open floatbox-close');
        $el.hide();
      });
    };

    var $popup = this.$('.innerPopup.first').clone();
    applyFloatbox($popup);
    $popup.floatOut();
  },

  /**
   * @param {String} name
   */
  showTab: function(name) {
    this.$('.example-navigation.tabs').tabs(name);
  },

  reloadChinese: function() {
    this.reload({foo: 'some chinese.. 百度一下，你就知道 繁體字!'});
  },

  myRemove: function() {
    this.remove();
  },

  loadExample: function() {
    this.popOutComponent(this.getClass(), {foo: 'value2', site: this.getParams().site});
  },

  loadExampleInline: function() {
    var handler = this;
    this.getParent().prepareComponent(this.getClass(), {foo: 'value3', site: this.getParams().site})
      .then(function(component) {
        component.$el.hide().insertBefore(handler.$el).slideDown(600);
      });
  },

  callAjaxTest: function() {
    var self = this;
    return this.ajax('test', {x: 'myX'}).then(function(data) {
      self.message('ajax_test(): ' + data);
    });
  },

  callRpc: function() {
    return cm.rpc(this.getClass() + '.time', []).then(function(timestamp) {
      cm.window.hint("Time: " + timestamp);
    });
  },

  error_500_text_callback: function() {
    var self = this;
    this.ajax('error', {status: 500, text: 'Errortext'}).catch(CM_Exception, function(error) {
      self.error('callback( type:' + error.name + ', msg:' + error.message + ' )');
    });
  },
  error_599_text: function() {
    this.ajax('error', {status: 599, text: 'Errortext'});
  },
  error_CM_Exception_public_callback: function() {
    var self = this;
    this.ajax('error', {exception: 'CM_Exception', text: 'Errortext', 'public': true})
      .catch(CM_Exception, function(error) {
        self.error('callback( type:' + error.name + ', msg:' + error.message + ' )');
      });
  },
  error_CM_Exception_public: function() {
    this.ajax('error', {exception: 'CM_Exception', text: 'Errortext', 'public': true});
  },
  error_CM_Exception: function() {
    this.ajax('error', {exception: 'CM_Exception', text: 'Errortext'});
  },
  error_CM_Exception_AuthRequired_public_callback: function() {
    var self = this;
    this.ajax('error', {exception: 'CM_Exception_AuthRequired', text: 'Errortext', 'public': true})
      .catch(CM_Exception, function(error) {
        self.error('callback( type:' + error.name + ', msg:' + error.message + ' )');
      });
  },
  error_CM_Exception_AuthRequired_public: function() {
    this.ajax('error', {exception: 'CM_Exception_AuthRequired', text: 'Errortext', 'public': true});
  },
  error_CM_Exception_AuthRequired: function() {
    this.ajax('error', {exception: 'CM_Exception_AuthRequired', text: 'Errortext'});
  },

  ping: function() {
    this.ajax('ping', {number: this.pingCount});
    this.pingCount++;
  },

  confirmAction: function() {
    cm.window.hint('Action Confirmed!');
  },

  toggleWindow: function($opener) {
    var $button = $opener.children('.panel');
    var $window = $opener.children('.window');
    $window.toggleModal(function() {
      $window.toggle();
      $button.toggleClass('active');
    });
  }
});
