/**
 * wp.media.view.Attachment.EditSelection
 *
 * @memberOf wp.media.view.Attachment
 *
 * @class
 * @augments wp.media.view.Attachment.Selection
 * @augments wp.media.view.Attachment
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var EditSelection = wp.media.view.Attachment.Selection.extend(/** @lends wp.media.view.Attachment.EditSelection.prototype */{
	buttons: {
		close: true
	}
});

module.exports = EditSelection;
