/**
 * External dependencies
 */
import {
	every,
	filter,
	find,
	forEach,
	map,
	some,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	ToggleControl,
	withNotices,
} from '@wordpress/components';
import {
	BlockIcon,
	MediaPlaceholder,
	InspectorControls,
} from '@wordpress/block-editor';
import { Component, Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getBlobByURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
import { withSelect } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import { icon } from './icons';
import { defaultColumnsNumber, pickRelevantMediaFiles } from './shared';
import Gallery from './gallery';

const MAX_COLUMNS = 8;
const linkOptions = [
	{ value: 'attachment', label: __( 'Attachment Page' ) },
	{ value: 'media', label: __( 'Media File' ) },
	{ value: 'none', label: __( 'None' ) },
];
const ALLOWED_MEDIA_TYPES = [ 'image' ];

class GalleryEdit extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectImage = this.onSelectImage.bind( this );
		this.onSelectImages = this.onSelectImages.bind( this );
		this.setLinkTo = this.setLinkTo.bind( this );
		this.setColumnsNumber = this.setColumnsNumber.bind( this );
		this.toggleImageCrop = this.toggleImageCrop.bind( this );
		this.onMove = this.onMove.bind( this );
		this.onMoveForward = this.onMoveForward.bind( this );
		this.onMoveBackward = this.onMoveBackward.bind( this );
		this.onRemoveImage = this.onRemoveImage.bind( this );
		this.onUploadError = this.onUploadError.bind( this );
		this.setImageAttributes = this.setImageAttributes.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.onFocusGalleryCaption = this.onFocusGalleryCaption.bind( this );

		this.state = {
			selectedImage: null,
			attachmentCaptions: null,
		};
	}

	setAttributes( attributes ) {
		if ( attributes.ids ) {
			throw new Error( 'The "ids" attribute should not be changed directly. It is managed automatically when "images" attribute changes' );
		}

		if ( attributes.images ) {
			attributes = {
				...attributes,
				ids: map( attributes.images, 'id' ),
			};
		}

		this.props.setAttributes( attributes );
	}

	onSelectImage( index ) {
		return () => {
			if ( this.state.selectedImage !== index ) {
				this.setState( {
					selectedImage: index,
				} );
			}
		};
	}

	onMove( oldIndex, newIndex ) {
		const images = [ ...this.props.attributes.images ];
		images.splice( newIndex, 1, this.props.attributes.images[ oldIndex ] );
		images.splice( oldIndex, 1, this.props.attributes.images[ newIndex ] );
		this.setState( { selectedImage: newIndex } );
		this.setAttributes( { images } );
	}

	onMoveForward( oldIndex ) {
		return () => {
			if ( oldIndex === this.props.attributes.images.length - 1 ) {
				return;
			}
			this.onMove( oldIndex, oldIndex + 1 );
		};
	}

	onMoveBackward( oldIndex ) {
		return () => {
			if ( oldIndex === 0 ) {
				return;
			}
			this.onMove( oldIndex, oldIndex - 1 );
		};
	}

	onRemoveImage( index ) {
		return () => {
			const images = filter( this.props.attributes.images, ( img, i ) => index !== i );
			const { columns } = this.props.attributes;
			this.setState( { selectedImage: null } );
			this.setAttributes( {
				images,
				columns: columns ? Math.min( images.length, columns ) : columns,
			} );
		};
	}

	selectCaption( newImage, images, attachmentCaptions ) {
		const currentImage = find(
			images, { id: newImage.id }
		);

		const currentImageCaption = currentImage ? currentImage.caption : newImage.caption;

		if ( ! attachmentCaptions ) {
			return currentImageCaption;
		}

		const attachment = find(
			attachmentCaptions, { id: newImage.id }
		);

		// if the attachment caption is updated
		if ( attachment && ( attachment.caption !== newImage.caption ) ) {
			return newImage.caption;
		}

		return currentImageCaption;
	}

	onSelectImages( newImages ) {
		const { columns, images } = this.props.attributes;
		const { attachmentCaptions } = this.state;
		this.setState(
			{
				attachmentCaptions: newImages.map( ( newImage ) => ( {
					id: newImage.id,
					caption: newImage.caption,
				} ) ),
			}
		);
		this.setAttributes( {
			images: newImages.map( ( newImage ) => ( {
				...pickRelevantMediaFiles( newImage ),
				caption: this.selectCaption( newImage, images, attachmentCaptions ),
			} ) ),
			columns: columns ? Math.min( newImages.length, columns ) : columns,
		} );
	}

	onUploadError( message ) {
		const { noticeOperations } = this.props;
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	}

	setLinkTo( value ) {
		this.setAttributes( { linkTo: value } );
	}

	setColumnsNumber( value ) {
		this.setAttributes( { columns: value } );
	}

	toggleImageCrop() {
		this.setAttributes( { imageCrop: ! this.props.attributes.imageCrop } );
	}

	getImageCropHelp( checked ) {
		return checked ? __( 'Thumbnails are cropped to align.' ) : __( 'Thumbnails are not cropped.' );
	}

	onFocusGalleryCaption() {
		this.setState( {
			selectedImage: null,
		} );
	}

	setImageAttributes( index, attributes ) {
		const { attributes: { images } } = this.props;
		const { setAttributes } = this;
		if ( ! images[ index ] ) {
			return;
		}
		setAttributes( {
			images: [
				...images.slice( 0, index ),
				{
					...images[ index ],
					...attributes,
				},
				...images.slice( index + 1 ),
			],
		} );
	}

	componentDidMount() {
		const { attributes, mediaUpload } = this.props;
		const { images } = attributes;
		if ( every( images, ( { url } ) => isBlobURL( url ) ) ) {
			const filesList = map( images, ( { url } ) => getBlobByURL( url ) );
			forEach( images, ( { url } ) => revokeBlobURL( url ) );
			mediaUpload( {
				filesList,
				onFileChange: this.onSelectImages,
				allowedTypes: [ 'image' ],
			} );
		}
	}

	componentDidUpdate( prevProps ) {
		// Deselect images when deselecting the block
		if ( ! this.props.isSelected && prevProps.isSelected ) {
			this.setState( {
				selectedImage: null,
				captionSelected: false,
			} );
		}
	}

	render() {
		const {
			attributes,
			className,
			isSelected,
			noticeUI,
		} = this.props;
		const {
			columns = defaultColumnsNumber( attributes ),
			imageCrop,
			images,
			linkTo,
		} = attributes;

		const hasImages = !! images.length;
		const hasImagesWithId = hasImages && some( images, ( { id } ) => id );

		const instructions = Platform.select( {
			web: __( 'Drag images, upload new ones or select files from your library.' ),
			native: __( 'Add media' ),
		} );

		const mediaPlaceholder = (
			<MediaPlaceholder
				addToGallery={ hasImagesWithId }
				isAppender={ hasImages }
				className={ className }
				disableMediaButtons={ hasImages && ! isSelected }
				icon={ ! hasImages && <BlockIcon icon={ icon } /> }
				labels={ {
					title: ! hasImages && __( 'Gallery' ),
					instructions: ! hasImages && instructions,
				} }
				onSelect={ this.onSelectImages }
				accept="image/*"
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				multiple
				value={ hasImagesWithId ? images : undefined }
				onError={ this.onUploadError }
				notices={ hasImages ? undefined : noticeUI }
				onFocus={ this.props.onFocus }
			/>
		);

		if ( ! hasImages ) {
			return mediaPlaceholder;
		}
		return (
			<>
				<InspectorControls>
					<PanelBody title={ __( 'Gallery Settings' ) }>
						{ images.length > 1 && <RangeControl
							label={ __( 'Columns' ) }
							icon={ 'admin-settings' }
							value={ columns }
							onChange={ this.setColumnsNumber }
							min={ 1 }
							max={ Math.min( MAX_COLUMNS, images.length ) }
							required
						/> }
						<ToggleControl
							label={ __( 'Crop Images' ) }
							checked={ !! imageCrop }
							onChange={ this.toggleImageCrop }
							help={ this.getImageCropHelp }
						/>
						<SelectControl
							label={ __( 'Link To' ) }
							value={ linkTo }
							onChange={ this.setLinkTo }
							options={ linkOptions }
						/>
					</PanelBody>
				</InspectorControls>
				{ noticeUI }
				<Gallery
					{ ...this.props }
					selectedImage={ this.state.selectedImage }
					mediaPlaceholder={ mediaPlaceholder }
					onMoveBackward={ this.onMoveBackward }
					onMoveForward={ this.onMoveForward }
					onRemoveImage={ this.onRemoveImage }
					onSelectImage={ this.onSelectImage }
					onSetImageAttributes={ this.setImageAttributes }
					onFocusGalleryCaption={ this.onFocusGalleryCaption }
				/>
			</>
		);
	}
}
export default compose( [
	withSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		const { mediaUpload } = getSettings();
		return { mediaUpload };
	} ),
	withNotices,
	withViewportMatch( { isMobile: '< small' } ),
] )( GalleryEdit );
