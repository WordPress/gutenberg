/**
 * wp.media.view.Attachment.Library
 *
 * @memberOf wp.media.view.Attachment
 *
 * @class
 * @augments wp.media.view.Attachment
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Library = wp.media.view.Attachment.extend(/** @lends wp.media.view.Attachment.Library.prototype */{
	buttons: {
		check: true
	}
});

module.exports = Library;
