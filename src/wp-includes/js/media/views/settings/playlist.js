/**
 * wp.media.view.Settings.Playlist
 *
 * @memberOf wp.media.view.Settings
 *
 * @class
 * @augments wp.media.view.Settings
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Playlist = wp.media.view.Settings.extend(/** @lends wp.media.view.Settings.Playlist.prototype */{
	className: 'collection-settings playlist-settings',
	template:  wp.template('playlist-settings')
});

module.exports = Playlist;
