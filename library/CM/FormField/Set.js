/**
 * @class CM_FormField_Set
 * @extends CM_FormField_Abstract
 */
var CM_FormField_Set = CM_FormField_Abstract.extend({
  _class: 'CM_FormField_Set',

  events: {
    'change input': function() {
      this.trigger('change');
    }
  },

  getValue: function() {
    return this.getArrayValue();
  }
});
