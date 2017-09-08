/**
 * wp.media.view.Settings.Gallery
 *
 * @memberOf wp.media.view.Settings
 *
 * @class
 * @augments wp.media.view.Settings
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Gallery = wp.media.view.Settings.extend(/** @lends wp.media.view.Settings.Gallery.prototype */{
	className: 'collection-settings gallery-settings',
	template:  wp.template('gallery-settings')
});

module.exports = Gallery;
