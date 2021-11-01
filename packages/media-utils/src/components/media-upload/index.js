/**
 * External dependencies
 */
import { castArray, defaults, pick, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as mediaUtilsStore } from '../../store';

const { wp } = window;

/**
 * The media library image object contains numerous attributes
 * we only need this set to display the image in the library.
 *
 * @param {Object} imgObject The image object, whose properties we want to filter.
 *
 * @return {Array<string>} A filtered image attributes array.
 */
const slimImageObject = ( imgObject ) => {
	return pick( imgObject, [
		'sizes',
		'mime',
		'type',
		'subtype',
		'id',
		'url',
		'alt',
		'link',
		'caption',
	] );
};

/**
 * Prepares the Featured Image toolbars and frames.
 *
 * @return {wp.media.view.MediaFrame.Select} The default media workflow.
 */
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
		 * Handle the edit state requirements of selected media item.
		 *
		 * @return {void}
		 */
		editState() {
			const selection = this.state( 'featured-image' ).get( 'selection' );
			const view = new wp.media.view.EditImage( {
				model: selection.single(),
				controller: this,
			} ).render();

			// Set the view to the EditImage frame using the selected image.
			this.content.set( view );

			// After bringing in the frame, load the actual editor via an ajax call.
			view.loadEditor();
		},

		/**
		 * Create the default states.
		 *
		 * @return {void}
		 */
		createStates: function createStates() {
			this.on(
				'toolbar:create:featured-image',
				this.featuredImageToolbar,
				this
			);
			this.on( 'content:render:edit-image', this.editState, this );

			this.states.add( [
				new wp.media.controller.FeaturedImage(),
				new wp.media.controller.EditImage( {
					model: this.options.editImage,
				} ),
			] );
		},
	} );
};

/**
 * Prepares the Gallery toolbars and frames.
 *
 * @return {wp.media.view.MediaFrame.Post} The default media workflow.
 */
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
		 * Set up gallery toolbar.
		 *
		 * @return {void}
		 */
		galleryToolbar() {
			const editing = this.state().get( 'editing' );
			this.toolbar.set(
				new wp.media.view.Toolbar( {
					controller: this,
					items: {
						insert: {
							style: 'primary',
							text: editing
								? wp.media.view.l10n.updateGallery
								: wp.media.view.l10n.insertGallery,
							priority: 80,
							requires: { library: true },

							/**
							 * @fires wp.media.controller.State#update
							 */
							click() {
								const controller = this.controller,
									state = controller.state();

								controller.close();
								state.trigger(
									'update',
									state.get( 'library' )
								);

								// Restore and reset the default state.
								controller.setState( controller.options.state );
								controller.reset();
							},
						},
					},
				} )
			);
		},

		/**
		 * Handle the edit state requirements of selected media item.
		 *
		 * @return {void}
		 */
		editState() {
			const selection = this.state( 'gallery' ).get( 'selection' );
			const view = new wp.media.view.EditImage( {
				model: selection.single(),
				controller: this,
			} ).render();

			// Set the view to the EditImage frame using the selected image.
			this.content.set( view );

			// After bringing in the frame, load the actual editor via an ajax call.
			view.loadEditor();
		},

		/**
		 * Create the default states.
		 *
		 * @return {void}
		 */
		createStates: function createStates() {
			this.on( 'toolbar:create:main-gallery', this.galleryToolbar, this );
			this.on( 'content:render:edit-image', this.editState, this );

			this.states.add( [
				new wp.media.controller.Library( {
					id: 'gallery',
					title: wp.media.view.l10n.createGalleryTitle,
					priority: 40,
					toolbar: 'main-gallery',
					filterable: 'uploaded',
					multiple: 'add',
					editable: false,

					library: wp.media.query(
						defaults(
							{
								type: 'image',
							},
							this.options.library
						)
					),
				} ),
				new wp.media.controller.EditImage( {
					model: this.options.editImage,
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

/**
 * Returns a collection of attachments for a given array of post ids.
 *
 * @param {Array<number>} ids An array of post ids.
 *
 * @return {Object} A collection of attachments.
 */
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

export default function MediaUpload( {
	allowedTypes = [],
	gallery = false,
	unstableFeaturedImageFlow = false,
	modalClass = '',
	multiple = false,
	title = __( 'Select or Upload Media' ),
	onSelect = noop,
	onRemove = noop,
	render = noop,
	onClose = noop,
	value = [],
	addToGallery = false,
} ) {
	const frame = useRef();
	const [ lastGalleryValue, setLastGalleryValue ] = useState( null );
	const { removeAttachment } = useDispatch( mediaUtilsStore );
	let GalleryDetailsMediaFrame;

	const renderOpenModal = () => {
		if ( gallery ) {
			buildAndSetGalleryFrame();
		}
		frame.current?.open();
	};

	const onOpenModal = () => {
		updateCollection();

		// Handle both value being either (number[]) multiple ids
		// (for galleries) or a (number) singular id (e.g. image block).
		const hasMedia = Array.isArray( value ) ? !! value?.length : !! value;

		if ( ! hasMedia ) {
			return;
		}

		const isGallery = gallery;
		const selection = frame.current?.state().get( 'selection' );

		if ( ! isGallery ) {
			castArray( value ).forEach( ( id ) => {
				selection.add( wp.media.attachment( id ) );
			} );
		}

		// Load the images so they are available in the media modal.
		const attachments = getAttachmentsCollection( castArray( value ) );

		// Once attachments are loaded, set the current selection.
		attachments.more().done( function () {
			if ( isGallery && attachments?.models?.length ) {
				selection.add( attachments.models );
			}
		} );
	};
	const onUpdate = ( selections ) => {
		const state = frame.current?.state();
		const selectedImages = selections || state.get( 'selection' );

		if ( ! selectedImages || ! selectedImages.models.length ) {
			return;
		}

		if ( multiple ) {
			onSelect(
				selectedImages.models.map( ( model ) =>
					slimImageObject( model.toJSON() )
				)
			);
		} else {
			onSelect( slimImageObject( selectedImages.models[ 0 ].toJSON() ) );
		}
	};

	const onCloseModal = () => {
		if ( onClose ) {
			onClose();
		}
	};

	const onRemoveSelectedAttachment = ( attachment ) => {
		if ( attachment.destroyed ) {
			console.log( 'onRemoveSelectedAttachment', attachment );
			removeAttachment( attachment );
			onRemove( attachment );
		}
	};

	const onSelectMedia = () => {
		// Get media attachment details from the frame state
		const attachment = frame.current?.state().get( 'selection' ).toJSON();
		onSelect( multiple ? attachment : attachment[ 0 ] );
	};

	/**
	 * Sets the Gallery frame and initializes listeners.
	 *
	 * @return {void}
	 */
	function buildAndSetGalleryFrame() {
		// If the value did not changed there is no need to rebuild the frame,
		// we can continue to use the existing one.
		if ( value === lastGalleryValue ) {
			return;
		}

		setLastGalleryValue( value );

		// If a frame already existed remove it.
		if ( frame.current ) {
			frame.current?.remove();
			frame.current = undefined;
		}
		let currentState;
		if ( addToGallery ) {
			currentState = 'gallery-library';
		} else {
			currentState = value && value.length ? 'gallery-edit' : 'gallery';
		}

		if ( ! GalleryDetailsMediaFrame ) {
			GalleryDetailsMediaFrame = getGalleryDetailsMediaFrame();
		}

		const attachments = getAttachmentsCollection( value );
		const selection = new wp.media.model.Selection( attachments?.models, {
			props: attachments?.props.toJSON(),
			multiple,
		} );

		frame.current = new GalleryDetailsMediaFrame( {
			mimeType: allowedTypes,
			state: currentState,
			multiple,
			selection,
			editing: !! ( value && value.length ),
		} );
		wp.media.frame = frame.current;
		initializeListeners();
	}

	/**
	 * Initializes the Media Library requirements for the featured image flow.
	 *
	 * @return {void}
	 */
	function buildAndSetFeatureImageFrame() {
		const featuredImageFrame = getFeaturedImageMediaFrame();
		const attachments = getAttachmentsCollection( value );
		const selection = new wp.media.model.Selection( attachments.models, {
			props: attachments.props.toJSON(),
		} );
		frame.current = new featuredImageFrame( {
			mimeType: allowedTypes,
			state: 'featured-image',
			multiple,
			selection,
			editing: !! value,
		} );
		wp.media.frame = frame.current;
	}

	function updateCollection() {
		const frameContent = frame.current?.content?.get();
		if ( frameContent && frameContent.collection ) {
			const collection = frameContent.collection;

			// clean all attachments we have in memory.
			collection
				.toArray()
				.forEach( ( model ) => model.trigger( 'destroy', model ) );

			// reset has more flag, if library had small amount of items all items may have been loaded before.
			collection.mirroring._hasMore = true;

			// request items
			collection.more();
		}
	}

	function initializeListeners() {
		frame.current?.on( 'select', onSelectMedia );
		frame.current?.on( 'update', onUpdate );
		frame.current?.on( 'open', onOpenModal );
		frame.current?.on( 'close', onCloseModal );
		frame.current?.listenTo(
			wp.media.model.Attachments.all,
			'remove',
			onRemoveSelectedAttachment
		);
	}

	function initializeMediaUploadFrame() {
		if ( gallery ) {
			buildAndSetGalleryFrame();
		} else {
			const frameConfig = {
				title,
				multiple,
			};
			if ( !! allowedTypes ) {
				frameConfig.library = { type: allowedTypes };
			}

			frame.current = wp.media( frameConfig );
		}

		if ( modalClass ) {
			frame.current.$el.addClass( modalClass );
		}

		if ( unstableFeaturedImageFlow ) {
			buildAndSetFeatureImageFrame();
		}

		initializeListeners();
	}
	// Initialize listeners.
	useEffect( () => {
		initializeMediaUploadFrame();
		return () => {
			frame.current?.remove();
		};
	}, [] );

	return render( { open: renderOpenModal } );
}
