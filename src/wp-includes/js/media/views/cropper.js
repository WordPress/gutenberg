var View = wp.media.View,
	UploaderStatus = wp.media.view.UploaderStatus,
	l10n = wp.media.view.l10n,
	$ = jQuery,
	Cropper;

/**
 * wp.media.view.Cropper
 *
 * Uses the imgAreaSelect plugin to allow a user to crop an image.
 *
 * Takes imgAreaSelect options from
 * wp.customize.HeaderControl.calculateImageSelectOptions via
 * wp.customize.HeaderControl.openMM.
 *
 * @memberOf wp.media.view
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
Cropper = View.extend(/** @lends wp.media.view.Cropper.prototype */{
	className: 'crop-content',
	template: wp.template('crop-content'),
	initialize: function() {
		_.bindAll(this, 'onImageLoad');
	},
	ready: function() {
		this.controller.frame.on('content:error:crop', this.onError, this);
		this.$image = this.$el.find('.crop-image');
		this.$image.on('load', this.onImageLoad);
		$(window).on('resize.cropper', _.debounce(this.onImageLoad, 250));
	},
	remove: function() {
		$(window).off('resize.cropper');
		this.$el.remove();
		this.$el.off();
		View.prototype.remove.apply(this, arguments);
	},
	prepare: function() {
		return {
			title: l10n.cropYourImage,
			url: this.options.attachment.get('url')
		};
	},
	onImageLoad: function() {
		var imgOptions = this.controller.get('imgSelectOptions'),
			imgSelect;

		if (typeof imgOptions === 'function') {
			imgOptions = imgOptions(this.options.attachment, this.controller);
		}

		imgOptions = _.extend(imgOptions, {
			parent: this.$el,
			onInit: function() {

				// Store the set ratio.
				var setRatio = imgSelect.getOptions().aspectRatio;

				// On mousedown, if no ratio is set and the Shift key is down, use a 1:1 ratio.
				this.parent.children().on( 'mousedown touchstart', function( e ) {

					// If no ratio is set and the shift key is down, use a 1:1 ratio.
					if ( ! setRatio && e.shiftKey ) {
						imgSelect.setOptions( {
							aspectRatio: '1:1'
						} );
					}
				} );

				this.parent.children().on( 'mouseup touchend', function() {

					// Restore the set ratio.
					imgSelect.setOptions( {
						aspectRatio: setRatio ? setRatio : false
					} );
				} );
			}
		} );
		this.trigger('image-loaded');
		imgSelect = this.controller.imgSelect = this.$image.imgAreaSelect(imgOptions);
	},
	onError: function() {
		var filename = this.options.attachment.get('filename');

		this.views.add( '.upload-errors', new wp.media.view.UploaderStatusError({
			filename: UploaderStatus.prototype.filename(filename),
			message: window._wpMediaViewsL10n.cropError
		}), { at: 0 });
	}
});

module.exports = Cropper;
