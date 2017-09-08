var Attachments = wp.media.view.Attachments,
	Selection;

/**
 * wp.media.view.Attachments.Selection
 *
 * @memberOf wp.media.view.Attachments
 *
 * @class
 * @augments wp.media.view.Attachments
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
Selection = Attachments.extend(/** @lends wp.media.view.Attachments.Selection.prototype */{
	events: {},
	initialize: function() {
		_.defaults( this.options, {
			sortable:   false,
			resize:     false,

			// The single `Attachment` view to be used in the `Attachments` view.
			AttachmentView: wp.media.view.Attachment.Selection
		});
		// Call 'initialize' directly on the parent class.
		return Attachments.prototype.initialize.apply( this, arguments );
	}
});

module.exports = Selection;
