/**
 * External Dependencies
 */
import { castArray, pick } from 'lodash';

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
					multiple: true,
				} ),

				new wp.media.controller.GalleryAdd(),
			] );
		},
	} );
};

const getPlaylistDetailsMediaFrame = () => {
	/**
	 * Custom Playlist details frame.
	 *
	 * @link https://github.com/xwp/wp-core-media-widgets/blob/905edbccfc2a623b73a93dac803c5335519d7837/wp-admin/js/widgets/media-gallery-widget.js
	 * @class PlaylistDetailsMediaFrame
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
					id: 'playlist',
					title: wp.media.view.l10n.createPlaylistTitle,
					priority: 60,
					toolbar: 'main-playlist',
					filterable: 'uploaded',
					multiple: 'add',
					editable: false,

					library: wp.media.query( _.defaults( {
						type: 'audio',
					}, this.options.library ) ),
				} ),

				new wp.media.controller.CollectionEdit( {
					type: 'audio',
					collectionType: 'playlist',
					title: wp.media.view.l10n.editPlaylistTitle,
					SettingsView: wp.media.view.Settings.Playlist,
					library: this.options.selection,
					editing: this.options.editing,
					menu: 'playlist',
					dragInfoText: wp.media.view.l10n.playlistDragInfo,
					dragInfo: true,
				} ),

				new wp.media.controller.CollectionAdd( {
					type: 'audio',
					collectionType: 'playlist',
					title: wp.media.view.l10n.addToPlaylistTitle,
				}	),

				new wp.media.controller.Library( {
					id: 'video-playlist',
					title: wp.media.view.l10n.createVideoPlaylistTitle,
					priority: 60,
					toolbar: 'main-video-playlist',
					filterable: 'uploaded',
					multiple: 'add',
					editable: false,

					library: wp.media.query( _.defaults( {
						type: 'video',
					}, this.options.library ) ),
				} ),

				new wp.media.controller.CollectionEdit( {
					type: 'video',
					collectionType: 'playlist',
					title: wp.media.view.l10n.editVideoPlaylistTitle,
					SettingsView: wp.media.view.Settings.Playlist,
					library: this.options.selection,
					editing: this.options.editing,
					menu: 'video-playlist',
					dragInfoText: wp.media.view.l10n.videoPlaylistDragInfo,
					dragInfo: false,
				} ),

				new wp.media.controller.CollectionAdd( {
					type: 'video',
					collectionType: 'playlist',
					title: wp.media.view.l10n.addToVideoPlaylistTitle,
				}	),

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

// the playlist object contains attributes required for render. These will be used for playlist
const playlistItemObject = ( playlistMedia ) => {
	const attrSet = [ 'sizes', 'mime', 'type', 'subtype', 'id', 'url', 'link', 'caption', 'album', 'artist', 'image', 'title' ];
	return pick( playlistMedia, attrSet );
};

const getAttachmentsCollection = ( ids ) => {
	return wp.media.query( {
		order: 'ASC',
		orderby: 'post__in',
		perPage: -1,
		post__in: ids,
		query: true,
		type: 'image',
	} );
};

class MediaUpload extends Component {
	constructor( { multiple = false, type, gallery = false, playlist = false, title = __( 'Select or Upload Media' ), modalClass, value } ) {
		super( ...arguments );
		this.openModal = this.openModal.bind( this );
		this.onOpen = this.onOpen.bind( this );
		this.onSelect = this.onSelect.bind( this );
		this.onUpdate = this.onUpdate.bind( this );
		this.processMediaCaption = this.processMediaCaption.bind( this );

		if ( gallery ) {
			const currentState = value ? 'gallery-edit' : 'gallery';
			const GalleryDetailsMediaFrame = getGalleryDetailsMediaFrame();
			const attachments = getAttachmentsCollection( value );
			const selection = new wp.media.model.Selection( attachments.models, {
				props: attachments.props.toJSON(),
				multiple,
			} );
			this.frame = new GalleryDetailsMediaFrame( {
				mimeType: type,
				state: currentState,
				multiple,
				selection,
				editing: ( value ) ? true : false,
			} );
			wp.media.frame = this.frame;
		}
		else {
			const frameConfig = {
				title,
				button: {
					text: __( 'Select' ),
				},
				multiple,
			};
			if ( !! type ) {
				frameConfig.library = { type };
			}

			this.frame = wp.media( frameConfig );
		}

		if ( playlist ) {
			const PlaylistDetailsMediaFrame = getPlaylistDetailsMediaFrame();
			this.frame = new PlaylistDetailsMediaFrame( {
				frame: 'select',
				mimeType: type,
				state: 'playlist',
			} );
			wp.media.frame = this.frame;
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
		const { onSelect, multiple = false, playlist = false } = this.props;
		const state = this.frame.state();
		const selectedImages = selections || state.get( 'selection' );

		if ( ! selectedImages || ! selectedImages.models.length ) {
			return;
		}

		if ( multiple ) {
			if ( playlist ) {
				onSelect( selectedImages.models.map( ( model ) => playlistItemObject( model.toJSON() ) ) );
			}
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
		if ( ! this.props.value ) {
			return;
		}
		if ( ! this.props.gallery ) {
			const selection = this.frame.state().get( 'selection' );
			castArray( this.props.value ).map( ( id ) => {
				selection.add( wp.media.attachment( id ) );
			} );
		}
		// load the images so they are available in the media modal.
		getAttachmentsCollection( castArray( this.props.value ) ).more();
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
