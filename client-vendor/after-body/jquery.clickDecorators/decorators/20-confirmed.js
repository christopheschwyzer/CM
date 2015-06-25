/*
 * Author: CM
 */
(function($) {

  /**
   * @param {jQuery} $elem
   * @constructor
   */
  var Confirmation = function($elem) {
    this._$elem = $elem;
  };

  Confirmation.prototype.activate = function() {
    this._$elem.addClass('confirmClick');
    this._$elem.addClass('clickConfirmed-active');
    this._$elem.data('confirmClick-data', this);

    var self = this;

    this._timeout = setTimeout(function() {
      self.deactivate();
    }, 4000);

    this._documentClickHandler = function(e) {
      if (!self._$elem.length || e.target !== self._$elem[0] && !$.contains(self._$elem[0], e.target)) {
        self.deactivate();
      }
    };

    setTimeout(function() {
      $(document).on('click.clickConfirmed', self._documentClickHandler);
    }, 0);
  };

  Confirmation.prototype.deactivate = function() {
    this._$elem.removeClass('confirmClick');
    this._$elem.removeClass('clickConfirmed-active');
    this._$elem.removeData('confirmClick-data');

    clearTimeout(this._timeout);
    $(document).off('click.clickConfirmed', this._documentClickHandler);
  };


  $.clickDecorators.confirmed = {
    isApplicable: function($element) {
      return $element.data('click-confirmed');
    },

    before: function(event) {
      var $this = $(this);
      var confirmation = $this.data('confirmClick-data');

      if (!confirmation) {
        confirmation = new Confirmation($this);
        confirmation.activate();
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },

    after: function(event) {
      var $this = $(this);
      var confirmation = $this.data('confirmClick-data');

      if (confirmation) {
        confirmation.deactivate();
      }
    }
  };

})(jQuery);
