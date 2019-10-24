/**
 * External dependencies
 */
import { castArray, defaults, pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const { wp } = window;

const getFeaturedImageMediaFrame = () => {
	return wp.media.view.MediaFrame.Select.extend( {
		/**
		 * Enables the Set Featured Image Button.
		 *
		 * @param {Object} toolbar toolbar for featured image state
		 * @return {void}
		 */
		featuredImageToolbar( toolbar ) {
			this.createSelectToolbar( toolbar, {
				text: wp.media.view.l10n.setFeaturedImage,
				state: this.options.state,
			} );
		},

		/**
		 * Create the default states.
		 *
		 * @return {void}
		 */
		createStates: function createStates() {
			this.on( 'toolbar:create:featured-image', this.featuredImageToolbar, this );
			this.states.add( [
				new wp.media.controller.FeaturedImage(),
			] );
		},
	} );
};

// Getter for the sake of unit tests.
const getGalleryDetailsMediaFrame = () => {
	/**
	 * Custom gallery details frame.
	 *
	 * @see https://github.com/xwp/wp-core-media-widgets/blob/905edbccfc2a623b73a93dac803c5335519d7837/wp-admin/js/widgets/media-gallery-widget.js
	 * @class GalleryDetailsMediaFrame
	 * @class
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

					library: wp.media.query( defaults( {
						type: 'image',
					}, this.options.library ) ),
				} ),

				new wp.media.controller.GalleryEdit( {
					library: this.options.selection,
					editing: this.options.editing,
					menu: 'gallery',
					displaySettings: false,
					multiple: true,
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

const getAttachmentsCollection = ( ids ) => {
	return wp.media.query( {
		order: 'ASC',
		orderby: 'post__in',
		post__in: ids,
		posts_per_page: -1,
		query: true,
		type: 'image',
	} );
};

class MediaUpload extends Component {
	constructor( {
		allowedTypes,
		gallery = false,
		unstableFeaturedImageFlow = false,
		modalClass,
		multiple = false,
		title = __( 'Select or Upload Media' ),
	} ) {
		super( ...arguments );
		this.openModal = this.openModal.bind( this );
		this.onOpen = this.onOpen.bind( this );
		this.onSelect = this.onSelect.bind( this );
		this.onUpdate = this.onUpdate.bind( this );
		this.onClose = this.onClose.bind( this );

		if ( gallery ) {
			this.buildAndSetGalleryFrame();
		} else {
			const frameConfig = {
				title,
				multiple,
			};
			if ( !! allowedTypes ) {
				frameConfig.library = { type: allowedTypes };
			}

			this.frame = wp.media( frameConfig );
		}

		if ( modalClass ) {
			this.frame.$el.addClass( modalClass );
		}

		if ( unstableFeaturedImageFlow ) {
			this.buildAndSetFeatureImageFrame();
		}

		this.initializeListeners();
	}

	initializeListeners() {
		// When an image is selected in the media frame...
		this.frame.on( 'select', this.onSelect );
		this.frame.on( 'update', this.onUpdate );
		this.frame.on( 'open', this.onOpen );
		this.frame.on( 'close', this.onClose );
	}

	buildAndSetGalleryFrame() {
		const {
			addToGallery = false,
			allowedTypes,
			multiple = false,
			value = null,
		} = this.props;
		// If the value did not changed there is no need to rebuild the frame,
		// we can continue to use the existing one.
		if ( value === this.lastGalleryValue ) {
			return;
		}

		this.lastGalleryValue = value;

		// If a frame already existed remove it.
		if ( this.frame ) {
			this.frame.remove();
		}
		let currentState;
		if ( addToGallery ) {
			currentState = 'gallery-library';
		} else {
			currentState = value ? 'gallery-edit' : 'gallery';
		}
		if ( ! this.GalleryDetailsMediaFrame ) {
			this.GalleryDetailsMediaFrame = getGalleryDetailsMediaFrame();
		}

		const attachments = getAttachmentsCollection( value );
		const selection = new wp.media.model.Selection( attachments.models, {
			props: attachments.props.toJSON(),
			multiple,
		} );
		this.frame = new this.GalleryDetailsMediaFrame( {
			mimeType: allowedTypes,
			state: currentState,
			multiple,
			selection,
			editing: ( value ) ? true : false,
		} );
		wp.media.frame = this.frame;
		this.initializeListeners();
	}

	buildAndSetFeatureImageFrame() {
		const featuredImageFrame = getFeaturedImageMediaFrame();
		const attachments = getAttachmentsCollection( this.props.value );
		const selection = new wp.media.model.Selection( attachments.models, {
			props: attachments.props.toJSON(),
		} );
		this.frame = new featuredImageFrame( {
			mimeType: this.props.allowedTypes,
			state: 'featured-image',
			multiple: this.props.multiple,
			selection,
			editing: ( this.props.value ) ? true : false,
		} );
		wp.media.frame = this.frame;
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
			onSelect( selectedImages.models.map( ( model ) => slimImageObject( model.toJSON() ) ) );
		} else {
			onSelect( slimImageObject( ( selectedImages.models[ 0 ].toJSON() ) ) );
		}
	}

	onSelect() {
		const { onSelect, multiple = false } = this.props;
		// Get media attachment details from the frame state
		const attachment = this.frame.state().get( 'selection' ).toJSON();
		onSelect(
			multiple ?
				attachment :
				attachment[ 0 ]
		);
	}

	onOpen() {
		this.updateCollection();

		if ( ! this.props.value ) {
			return;
		}
		if ( ! this.props.gallery ) {
			const selection = this.frame.state().get( 'selection' );
			castArray( this.props.value ).forEach( ( id ) => {
				selection.add( wp.media.attachment( id ) );
			} );
		}

		// load the images so they are available in the media modal.
		getAttachmentsCollection( castArray( this.props.value ) ).more();
	}

	onClose() {
		const { onClose } = this.props;

		if ( onClose ) {
			onClose();
		}
	}

	updateCollection() {
		const frameContent = this.frame.content.get();
		if ( frameContent && frameContent.collection ) {
			const collection = frameContent.collection;

			// clean all attachments we have in memory.
			collection.toArray().forEach( ( model ) => model.trigger( 'destroy', model ) );

			// reset has more flag, if library had small amount of items all items may have been loaded before.
			collection.mirroring._hasMore = true;

			// request items
			collection.more();
		}
	}

	openModal() {
		if (
			this.props.gallery &&
			this.props.value &&
			this.props.value.length > 0
		) {
			this.buildAndSetGalleryFrame();
		}
		this.frame.open();
	}

	render() {
		return this.props.render( { open: this.openModal } );
	}
}

export default MediaUpload;

