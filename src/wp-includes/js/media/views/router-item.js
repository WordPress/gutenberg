/**
 * wp.media.view.RouterItem
 *
 * @memberOf wp.media.view
 *
 * @class
 * @augments wp.media.view.MenuItem
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var RouterItem = wp.media.view.MenuItem.extend(/** @lends wp.media.view.RouterItem.prototype */{
	/**
	 * On click handler to activate the content region's corresponding mode.
	 */
	click: function() {
		var contentMode = this.options.contentMode;
		if ( contentMode ) {
			this.controller.content.mode( contentMode );
		}
	}
});

module.exports = RouterItem;
