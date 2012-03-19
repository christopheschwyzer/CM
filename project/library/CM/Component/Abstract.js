_ready: function() {
	this.$(".timeago").timeago();
	this.$().placeholder();
	this.$('button[title]').qtip({
		position: {my: 'bottom center', at: 'top center'},
		style: {classes: 'ui-tooltip-tipped'}
	});

	this.ready();
	_.each(this.getChildren(), function(child) {
		child._ready();
	});
},

/**
 * Called on popOut()
 */
repaint: function() {
},

/**
 * @return jQuery
 */
$: function(selector) {
	if (!selector) {
		return this.$el;
	}
	selector = selector.replace('#', '#'+this.getAutoId()+'-');
	return $(selector, this.el);
},

popOut: function(options) {
	this.$().floatOut(options);
	this.repaint();
},

popIn: function() {
	this.$().floatIn();
},

/**
 * @param string message
 */
error: function(message) {
	cm.window.hint(message);
},

/**
 * @param string message
 */
message: function(message) {
	cm.window.hint(message);
},

/**
 * @return XMLHttpRequest
 */
reload: function(params) {
	return this.ajaxModal('reload', params);
},

/**
 * @param string key
 * @param mixed key
 */
storageSet: function(key, value) {
	cm.storage.set(this._class + '_' + key, value);
},

/**
 * @param string key
 * @return mixed
 */
storageGet: function(key) {
	return cm.storage.get(this._class + '_' + key);
},

/**
 * @param string key
 */
storageDelete: function(key) {
	cm.storage.del(this._class + '_' + key);
}