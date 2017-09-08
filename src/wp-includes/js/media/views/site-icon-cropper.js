var View = wp.media.view,
	SiteIconCropper;

/**
 * wp.media.view.SiteIconCropper
 *
 * Uses the imgAreaSelect plugin to allow a user to crop a Site Icon.
 *
 * Takes imgAreaSelect options from
 * wp.customize.SiteIconControl.calculateImageSelectOptions.
 *
 * @memberOf wp.media.view
 *
 * @class
 * @augments wp.media.view.Cropper
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
SiteIconCropper = View.Cropper.extend(/** @lends wp.media.view.SiteIconCropper.prototype */{
	className: 'crop-content site-icon',

	ready: function () {
		View.Cropper.prototype.ready.apply( this, arguments );

		this.$( '.crop-image' ).on( 'load', _.bind( this.addSidebar, this ) );
	},

	addSidebar: function() {
		this.sidebar = new wp.media.view.Sidebar({
			controller: this.controller
		});

		this.sidebar.set( 'preview', new wp.media.view.SiteIconPreview({
			controller: this.controller,
			attachment: this.options.attachment
		}) );

		this.controller.cropperView.views.add( this.sidebar );
	}
});

module.exports = SiteIconCropper;
