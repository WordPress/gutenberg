/**
 * External dependencies
 */
import { get, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	withNotices,
	RangeControl,
} from '@wordpress/components';
import {
	MediaPlaceholder,
	InspectorControls,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Platform, useEffect, useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getBlobByURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
import { useDispatch, useSelect } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';
import { View } from '@wordpress/primitives';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { sharedIcon } from '../shared-icon';
import { pickRelevantMediaFiles } from './shared';
import { defaultColumnsNumberV1 } from '../deprecated';
import Gallery from './gallery';
import {
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_NONE,
} from './constants';

const MAX_COLUMNS = 8;
const linkOptions = [
	{ value: LINK_DESTINATION_ATTACHMENT, label: __( 'Attachment Page' ) },
	{ value: LINK_DESTINATION_MEDIA, label: __( 'Media File' ) },
	{ value: LINK_DESTINATION_NONE, label: __( 'None' ) },
];
const ALLOWED_MEDIA_TYPES = [ 'image' ];

const PLACEHOLDER_TEXT = Platform.select( {
	web: __(
		'Drag images, upload new ones or select files from your library.'
	),
	native: __( 'ADD MEDIA' ),
} );

const MOBILE_CONTROL_PROPS_RANGE_CONTROL = Platform.select( {
	web: {},
	native: { type: 'stepper' },
} );

function GalleryEdit( props ) {
	const {
		attributes,
		clientId,
		isSelected,
		noticeUI,
		noticeOperations,
		onFocus,
	} = props;
	const {
		columns = defaultColumnsNumberV1( attributes ),
		imageCrop,
		images,
		linkTo,
		sizeSlug,
	} = attributes;
	const [ selectedImage, setSelectedImage ] = useState();
	const [ attachmentCaptions, setAttachmentCaptions ] = useState();
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const { imageSizes, mediaUpload, getMedia, wasBlockJustInserted } =
		useSelect( ( select ) => {
			const settings = select( blockEditorStore ).getSettings();

			return {
				imageSizes: settings.imageSizes,
				mediaUpload: settings.mediaUpload,
				getMedia: select( coreStore ).getMedia,
				wasBlockJustInserted: select(
					blockEditorStore
				).wasBlockJustInserted( clientId, 'inserter_menu' ),
			};
		} );

	const resizedImages = useMemo( () => {
		if ( isSelected ) {
			return ( attributes.ids ?? [] ).reduce(
				( currentResizedImages, id ) => {
					if ( ! id ) {
						return currentResizedImages;
					}
					const image = getMedia( id );
					const sizes = imageSizes.reduce( ( currentSizes, size ) => {
						const defaultUrl = get( image, [
							'sizes',
							size.slug,
							'url',
						] );
						const mediaDetailsUrl = get( image, [
							'media_details',
							'sizes',
							size.slug,
							'source_url',
						] );
						return {
							...currentSizes,
							[ size.slug ]: defaultUrl || mediaDetailsUrl,
						};
					}, {} );
					return {
						...currentResizedImages,
						[ parseInt( id, 10 ) ]: sizes,
					};
				},
				{}
			);
		}
		return {};
	}, [ isSelected, attributes.ids, imageSizes ] );

	function onFocusGalleryCaption() {
		setSelectedImage();
	}

	function setAttributes( newAttrs ) {
		if ( newAttrs.ids ) {
			throw new Error(
				'The "ids" attribute should not be changed directly. It is managed automatically when "images" attribute changes'
			);
		}

		if ( newAttrs.images ) {
			newAttrs = {
				...newAttrs,
				// Unlike images[ n ].id which is a string, always ensure the
				// ids array contains numbers as per its attribute type.
				ids: newAttrs.images.map( ( { id } ) => parseInt( id, 10 ) ),
			};
		}

		props.setAttributes( newAttrs );
	}

	function onSelectImage( index ) {
		return () => {
			setSelectedImage( index );
		};
	}

	function onDeselectImage() {
		return () => {
			setSelectedImage();
		};
	}

	function onMove( oldIndex, newIndex ) {
		const newImages = [ ...images ];
		newImages.splice( newIndex, 1, images[ oldIndex ] );
		newImages.splice( oldIndex, 1, images[ newIndex ] );
		setSelectedImage( newIndex );
		setAttributes( { images: newImages } );
	}

	function onMoveForward( oldIndex ) {
		return () => {
			if ( oldIndex === images.length - 1 ) {
				return;
			}
			onMove( oldIndex, oldIndex + 1 );
		};
	}

	function onMoveBackward( oldIndex ) {
		return () => {
			if ( oldIndex === 0 ) {
				return;
			}
			onMove( oldIndex, oldIndex - 1 );
		};
	}

	function onRemoveImage( index ) {
		return () => {
			const newImages = images.filter( ( img, i ) => index !== i );
			setSelectedImage();
			setAttributes( {
				images: newImages,
				columns: attributes.columns
					? Math.min( newImages.length, attributes.columns )
					: attributes.columns,
			} );
		};
	}

	function selectCaption( newImage ) {
		// The image id in both the images and attachmentCaptions arrays is a
		// string, so ensure comparison works correctly by converting the
		// newImage.id to a string.
		const newImageId = newImage.id.toString();
		const currentImage = images.find( ( { id } ) => id === newImageId );
		const currentImageCaption = currentImage
			? currentImage.caption
			: newImage.caption;

		if ( ! attachmentCaptions ) {
			return currentImageCaption;
		}

		const attachment = attachmentCaptions.find(
			( { id } ) => id === newImageId
		);

		// If the attachment caption is updated.
		if ( attachment && attachment.caption !== newImage.caption ) {
			return newImage.caption;
		}

		return currentImageCaption;
	}

	function onSelectImages( newImages ) {
		setAttachmentCaptions(
			newImages.map( ( newImage ) => ( {
				// Store the attachmentCaption id as a string for consistency
				// with the type of the id in the images attribute.
				id: newImage.id.toString(),
				caption: newImage.caption,
			} ) )
		);
		setAttributes( {
			images: newImages.map( ( newImage ) => ( {
				...pickRelevantMediaFiles( newImage, sizeSlug ),
				caption: selectCaption( newImage, images, attachmentCaptions ),
				// The id value is stored in a data attribute, so when the
				// block is parsed it's converted to a string. Converting
				// to a string here ensures it's type is consistent.
				id: newImage.id.toString(),
			} ) ),
			columns: attributes.columns
				? Math.min( newImages.length, attributes.columns )
				: attributes.columns,
		} );
	}

	function onUploadError( message ) {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	}

	function setLinkTo( value ) {
		setAttributes( { linkTo: value } );
	}

	function setColumnsNumber( value ) {
		setAttributes( { columns: value } );
	}

	function toggleImageCrop() {
		setAttributes( { imageCrop: ! imageCrop } );
	}

	function getImageCropHelp( checked ) {
		return checked
			? __( 'Thumbnails are cropped to align.' )
			: __( 'Thumbnails are not cropped.' );
	}

	function setImageAttributes( index, newAttributes ) {
		if ( ! images[ index ] ) {
			return;
		}

		setAttributes( {
			images: [
				...images.slice( 0, index ),
				{
					...images[ index ],
					...newAttributes,
				},
				...images.slice( index + 1 ),
			],
		} );
	}

	function getImagesSizeOptions() {
		const resizedImageSizes = Object.values( resizedImages );
		return imageSizes
			.filter( ( { slug } ) =>
				resizedImageSizes.some( ( sizes ) => sizes[ slug ] )
			)
			.map( ( { name, slug } ) => ( { value: slug, label: name } ) );
	}

	function updateImagesSize( newSizeSlug ) {
		const updatedImages = ( images ?? [] ).map( ( image ) => {
			if ( ! image.id ) {
				return image;
			}
			const url = get( resizedImages, [
				parseInt( image.id, 10 ),
				newSizeSlug,
			] );
			return {
				...image,
				...( url && { url } ),
			};
		} );

		setAttributes( { images: updatedImages, sizeSlug: newSizeSlug } );
	}

	useEffect( () => {
		if (
			Platform.OS === 'web' &&
			images &&
			images.length > 0 &&
			images.every( ( { url } ) => isBlobURL( url ) )
		) {
			const filesList = images.map( ( { url } ) => getBlobByURL( url ) );
			images.forEach( ( { url } ) => revokeBlobURL( url ) );
			mediaUpload( {
				filesList,
				onFileChange: onSelectImages,
				allowedTypes: [ 'image' ],
			} );
		}
	}, [] );

	useEffect( () => {
		// Deselect images when deselecting the block.
		if ( ! isSelected ) {
			setSelectedImage();
		}
	}, [ isSelected ] );

	useEffect( () => {
		// linkTo attribute must be saved so blocks don't break when changing
		// image_default_link_type in options.php.
		if ( ! linkTo ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				linkTo:
					window?.wp?.media?.view?.settings?.defaultProps?.link ||
					LINK_DESTINATION_NONE,
			} );
		}
	}, [ linkTo ] );

	const hasImages = !! images.length;
	const hasImageIds = hasImages && images.some( ( image ) => !! image.id );

	const mediaPlaceholder = (
		<MediaPlaceholder
			addToGallery={ hasImageIds }
			isAppender={ hasImages }
			disableMediaButtons={ hasImages && ! isSelected }
			icon={ ! hasImages && sharedIcon }
			labels={ {
				title: ! hasImages && __( 'Gallery' ),
				instructions: ! hasImages && PLACEHOLDER_TEXT,
			} }
			onSelect={ onSelectImages }
			accept="image/*"
			allowedTypes={ ALLOWED_MEDIA_TYPES }
			multiple
			value={ hasImageIds ? images : {} }
			onError={ onUploadError }
			notices={ hasImages ? undefined : noticeUI }
			onFocus={ onFocus }
			autoOpenMediaUpload={
				! hasImages && isSelected && wasBlockJustInserted
			}
		/>
	);

	const blockProps = useBlockProps();

	if ( ! hasImages ) {
		return <View { ...blockProps }>{ mediaPlaceholder }</View>;
	}

	const imageSizeOptions = getImagesSizeOptions();
	const shouldShowSizeOptions = hasImages && ! isEmpty( imageSizeOptions );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					{ images.length > 1 && (
						<RangeControl
							__nextHasNoMarginBottom
							label={ __( 'Columns' ) }
							value={ columns }
							onChange={ setColumnsNumber }
							min={ 1 }
							max={ Math.min( MAX_COLUMNS, images.length ) }
							{ ...MOBILE_CONTROL_PROPS_RANGE_CONTROL }
							required
						/>
					) }
					<ToggleControl
						label={ __( 'Crop images' ) }
						checked={ !! imageCrop }
						onChange={ toggleImageCrop }
						help={ getImageCropHelp }
					/>
					<SelectControl
						__nextHasNoMarginBottom
						label={ __( 'Link to' ) }
						value={ linkTo }
						onChange={ setLinkTo }
						options={ linkOptions }
						hideCancelButton={ true }
					/>
					{ shouldShowSizeOptions && (
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Image size' ) }
							value={ sizeSlug }
							options={ imageSizeOptions }
							onChange={ updateImagesSize }
							hideCancelButton={ true }
						/>
					) }
				</PanelBody>
			</InspectorControls>
			{ noticeUI }
			<Gallery
				{ ...props }
				selectedImage={ selectedImage }
				mediaPlaceholder={ mediaPlaceholder }
				onMoveBackward={ onMoveBackward }
				onMoveForward={ onMoveForward }
				onRemoveImage={ onRemoveImage }
				onSelectImage={ onSelectImage }
				onDeselectImage={ onDeselectImage }
				onSetImageAttributes={ setImageAttributes }
				blockProps={ blockProps }
				// This prop is used by gallery.native.js.
				onFocusGalleryCaption={ onFocusGalleryCaption }
			/>
		</>
	);
}

export default compose( [
	withNotices,
	withViewportMatch( { isNarrow: '< small' } ),
] )( GalleryEdit );
