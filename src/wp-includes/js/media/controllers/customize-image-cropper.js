/**
 * wp.media.controller.CustomizeImageCropper
 *
 * A state for cropping an image.
 *
 * @class
 * @augments wp.media.controller.Cropper
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 */
var Controller = wp.media.controller,
	CustomizeImageCropper;

CustomizeImageCropper = Controller.Cropper.extend({
	doCrop: function( attachment ) {
		var cropDetails = attachment.get( 'cropDetails' ),
			control = this.get( 'control' );

		if ( ! control.params.flex_width ) {
			cropDetails.dst_width = control.params.width;
		}
		if ( ! control.params.flex_height ) {
			cropDetails.dst_height = control.params.height;
		}

		return wp.ajax.post( 'crop-image', {
			wp_customize: 'on',
			nonce: attachment.get( 'nonces' ).edit,
			id: attachment.get( 'id' ),
			context: control.id,
			cropDetails: cropDetails
		} );
	}
});

module.exports = CustomizeImageCropper;
