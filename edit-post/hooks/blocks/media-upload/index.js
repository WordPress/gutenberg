/**
 * External Dependencies
 */
import { pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { parseWithAttributeSchema } from '@wordpress/blocks';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

// Getter for the sake of unit tests.
const getGalleryDetailsMediaFrame = () => {
	/**
	 * Custom gallery details frame.
	 *
	 * @link https://github.com/xwp/wp-core-media-widgets/blob/905edbccfc2a623b73a93dac803c5335519d7837/wp-admin/js/widgets/media-gallery-widget.js
	 * @class GalleryDetailsMediaFrame
	 * @constructor
	 */
	return wp.media.view.MediaFrame.Post.extend( {

		/**
		 * Create the default states.
		 *
		 * @return {void}
		 */
		createStates: function createStates() {
			this.states.add( [
				new wp.media.controller.Library( {
					id: 'gallery',
					title: wp.media.view.l10n.createGalleryTitle,
					priority: 40,
					toolbar: 'main-gallery',
					filterable: 'uploaded',
					multiple: 'add',
					editable: false,

					library: wp.media.query( _.defaults( {
						type: 'image',
					}, this.options.library ) ),
				} ),

				new wp.media.controller.GalleryEdit( {
					library: this.options.selection,
					editing: this.options.editing,
					menu: 'gallery',
					displaySettings: false,
				} ),

				new wp.media.controller.GalleryAdd(),
			] );
		},
	} );
};

// the media library image object contains numerous attributes
// we only need this set to display the image in the library
const slimImageObject = ( img ) => {
	const attrSet = [ 'sizes', 'mime', 'type', 'subtype', 'id', 'url', 'alt', 'link', 'caption' ];
	return pick( img, attrSet );
};

class MediaUpload extends Component {
	constructor( { multiple = false, type, gallery = false, title = __( 'Select or Upload Media' ), modalClass } ) {
		super( ...arguments );
		this.openModal = this.openModal.bind( this );
		this.onSelect = this.onSelect.bind( this );
		this.onUpdate = this.onUpdate.bind( this );
		this.onOpen = this.onOpen.bind( this );
		this.processMediaCaption = this.processMediaCaption.bind( this );
		const frameConfig = {
			title,
			button: {
				text: __( 'Select' ),
			},
			multiple,
			selection: new wp.media.model.Selection( [] ),
		};
		if ( !! type ) {
			frameConfig.library = { type };
		}

		if ( gallery ) {
			const GalleryDetailsMediaFrame = getGalleryDetailsMediaFrame();
			this.frame = new GalleryDetailsMediaFrame( {
				frame: 'select',
				mimeType: type,
				state: 'gallery',
			} );
			wp.media.frame = this.frame;
		} else {
			this.frame = wp.media( frameConfig );
		}

		if ( modalClass ) {
			this.frame.$el.addClass( modalClass );
		}

		// When an image is selected in the media frame...
		this.frame.on( 'select', this.onSelect );
		this.frame.on( 'update', this.onUpdate );
		this.frame.on( 'open', this.onOpen );
	}

	componentWillUnmount() {
		this.frame.remove();
	}

	onUpdate( selections ) {
		const { onSelect, multiple = false } = this.props;
		const state = this.frame.state();
		const selectedImages = selections || state.get( 'selection' );

		if ( ! selectedImages || ! selectedImages.models.length ) {
			return;
		}

		if ( multiple ) {
			onSelect( selectedImages.models.map( ( model ) => this.processMediaCaption( slimImageObject( model.toJSON() ) ) ) );
		} else {
			onSelect( this.processMediaCaption( slimImageObject( ( selectedImages.models[ 0 ].toJSON() ) ) ) );
		}
	}

	onSelect() {
		const { onSelect, multiple = false } = this.props;
		// Get media attachment details from the frame state
		const attachment = this.frame.state().get( 'selection' ).toJSON();
		onSelect(
			multiple ?
				attachment.map( this.processMediaCaption ) :
				this.processMediaCaption( attachment[ 0 ] )
		);
	}

	onOpen() {
		const selection = this.frame.state().get( 'selection' );
		const addMedia = ( id ) => {
			const attachment = wp.media.attachment( id );
			attachment.fetch();
			selection.add( attachment );
		};

		if ( ! this.props.value ) {
			return;
		}

		if ( this.props.multiple ) {
			this.props.value.map( addMedia );
		} else {
			addMedia( this.props.value );
		}
	}

	openModal() {
		this.frame.open();
	}

	processMediaCaption( mediaObject ) {
		return ! mediaObject.caption ?
			mediaObject :
			{ ...mediaObject, caption: parseWithAttributeSchema( mediaObject.caption, {
				source: 'children',
			} ) };
	}

	render() {
		return this.props.render( { open: this.openModal } );
	}
}

export default MediaUpload;

