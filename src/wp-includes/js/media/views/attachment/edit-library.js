/**
 * wp.media.view.Attachment.EditLibrary
 *
 * @memberOf wp.media.view.Attachment
 *
 * @class
 * @augments wp.media.view.Attachment
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var EditLibrary = wp.media.view.Attachment.extend(/** @lends wp.media.view.Attachment.EditLibrary.prototype */{
	buttons: {
		close: true
	}
});

module.exports = EditLibrary;
