/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import {
	BaseControl,
	PanelBody,
	SelectControl,
	ToggleControl,
	RangeControl,
	Spinner,
} from '@wordpress/components';
import {
	store as blockEditorStore,
	MediaPlaceholder,
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
	MediaReplaceFlow,
} from '@wordpress/block-editor';
import { Platform, useEffect, useMemo } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';
import { View } from '@wordpress/primitives';
import { createBlock } from '@wordpress/blocks';
import { createBlobURL } from '@wordpress/blob';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { sharedIcon } from './shared-icon';
import { defaultColumnsNumber, pickRelevantMediaFiles } from './shared';
import { getHrefAndDestination } from './utils';
import {
	getUpdatedLinkTargetSettings,
	getImageSizeAttributes,
} from '../image/utils';
import Gallery from './gallery';
import {
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_NONE,
} from './constants';
import useImageSizes from './use-image-sizes';
import useGetNewImages from './use-get-new-images';
import useGetMedia from './use-get-media';
import GapStyles from './gap-styles';

const MAX_COLUMNS = 8;
const linkOptions = [
	{ value: LINK_DESTINATION_ATTACHMENT, label: __( 'Attachment Page' ) },
	{ value: LINK_DESTINATION_MEDIA, label: __( 'Media File' ) },
	{
		value: LINK_DESTINATION_NONE,
		label: _x( 'None', 'Media item link option' ),
	},
];
const ALLOWED_MEDIA_TYPES = [ 'image' ];

const PLACEHOLDER_TEXT = Platform.isNative
	? __( 'Add media' )
	: __( 'Drag images, upload new ones or select files from your library.' );

const MOBILE_CONTROL_PROPS_RANGE_CONTROL = Platform.isNative
	? { type: 'stepper' }
	: {};

const EMPTY_ARRAY = [];

function GalleryEdit( props ) {
	const {
		setAttributes,
		attributes,
		className,
		clientId,
		isSelected,
		insertBlocksAfter,
		isContentLocked,
		onFocus,
	} = props;

	const { columns, imageCrop, randomOrder, linkTarget, linkTo, sizeSlug } =
		attributes;

	const {
		__unstableMarkNextChangeAsNotPersistent,
		replaceInnerBlocks,
		updateBlockAttributes,
		selectBlock,
	} = useDispatch( blockEditorStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const {
		getBlock,
		getSettings,
		preferredStyle,
		innerBlockImages,
		blockWasJustInserted,
		multiGallerySelection,
	} = useSelect(
		( select ) => {
			const {
				getBlockName,
				getMultiSelectedBlockClientIds,
				getSettings: _getSettings,
				getBlock: _getBlock,
				wasBlockJustInserted,
			} = select( blockEditorStore );
			const preferredStyleVariations =
				_getSettings().__experimentalPreferredStyleVariations;
			const multiSelectedClientIds = getMultiSelectedBlockClientIds();

			return {
				getBlock: _getBlock,
				getSettings: _getSettings,
				preferredStyle:
					preferredStyleVariations?.value?.[ 'core/image' ],
				innerBlockImages:
					_getBlock( clientId )?.innerBlocks ?? EMPTY_ARRAY,
				blockWasJustInserted: wasBlockJustInserted(
					clientId,
					'inserter_menu'
				),
				multiGallerySelection:
					multiSelectedClientIds.length &&
					multiSelectedClientIds.every(
						( _clientId ) =>
							getBlockName( _clientId ) === 'core/gallery'
					),
			};
		},
		[ clientId ]
	);

	const images = useMemo(
		() =>
			innerBlockImages?.map( ( block ) => ( {
				clientId: block.clientId,
				id: block.attributes.id,
				url: block.attributes.url,
				attributes: block.attributes,
				fromSavedContent: Boolean( block.originalContent ),
			} ) ),
		[ innerBlockImages ]
	);

	const imageData = useGetMedia( innerBlockImages );

	const newImages = useGetNewImages( images, imageData );

	useEffect( () => {
		newImages?.forEach( ( newImage ) => {
			// Update the images data without creating new undo levels.
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( newImage.clientId, {
				...buildImageAttributes( newImage.attributes ),
				id: newImage.id,
				align: undefined,
			} );
		} );
	}, [ newImages ] );

	const imageSizeOptions = useImageSizes(
		imageData,
		isSelected,
		getSettings
	);

	/**
	 * Determines the image attributes that should be applied to an image block
	 * after the gallery updates.
	 *
	 * The gallery will receive the full collection of images when a new image
	 * is added. As a result we need to reapply the image's original settings if
	 * it already existed in the gallery. If the image is in fact new, we need
	 * to apply the gallery's current settings to the image.
	 *
	 * @param {Object} imageAttributes Media object for the actual image.
	 * @return {Object}                Attributes to set on the new image block.
	 */
	function buildImageAttributes( imageAttributes ) {
		const image = imageAttributes.id
			? imageData.find( ( { id } ) => id === imageAttributes.id )
			: null;

		let newClassName;
		if ( imageAttributes.className && imageAttributes.className !== '' ) {
			newClassName = imageAttributes.className;
		} else {
			newClassName = preferredStyle
				? `is-style-${ preferredStyle }`
				: undefined;
		}

		let newLinkTarget;
		if ( imageAttributes.linkTarget || imageAttributes.rel ) {
			// When transformed from image blocks, the link destination and rel attributes are inherited.
			newLinkTarget = {
				linkTarget: imageAttributes.linkTarget,
				rel: imageAttributes.rel,
			};
		} else {
			// When an image is added, update the link destination and rel attributes according to the gallery settings
			newLinkTarget = getUpdatedLinkTargetSettings(
				linkTarget,
				attributes
			);
		}

		return {
			...pickRelevantMediaFiles( image, sizeSlug ),
			...getHrefAndDestination(
				image,
				linkTo,
				imageAttributes?.linkDestination
			),
			...newLinkTarget,
			className: newClassName,
			sizeSlug,
			caption: imageAttributes.caption || image.caption?.raw,
			alt: imageAttributes.alt || image.alt_text,
		};
	}

	function isValidFileType( file ) {
		// It's necessary to retrieve the media type from the raw image data for already-uploaded images on native.
		const nativeFileData =
			Platform.isNative && file.id
				? imageData.find( ( { id } ) => id === file.id )
				: null;

		const mediaTypeSelector = nativeFileData
			? nativeFileData?.media_type
			: file.type;

		return (
			ALLOWED_MEDIA_TYPES.some(
				( mediaType ) => mediaTypeSelector?.indexOf( mediaType ) === 0
			) || file.url?.indexOf( 'blob:' ) === 0
		);
	}

	function updateImages( selectedImages ) {
		const newFileUploads =
			Object.prototype.toString.call( selectedImages ) ===
			'[object FileList]';

		const imageArray = newFileUploads
			? Array.from( selectedImages ).map( ( file ) => {
					if ( ! file.url ) {
						return pickRelevantMediaFiles( {
							url: createBlobURL( file ),
						} );
					}

					return file;
			  } )
			: selectedImages;

		if ( ! imageArray.every( isValidFileType ) ) {
			createErrorNotice(
				__(
					'If uploading to a gallery all files need to be image formats'
				),
				{ id: 'gallery-upload-invalid-file', type: 'snackbar' }
			);
		}

		const processedImages = imageArray
			.filter( ( file ) => file.url || isValidFileType( file ) )
			.map( ( file ) => {
				if ( ! file.url ) {
					return pickRelevantMediaFiles( {
						url: createBlobURL( file ),
					} );
				}

				return file;
			} );

		// Because we are reusing existing innerImage blocks any reordering
		// done in the media library will be lost so we need to reapply that ordering
		// once the new image blocks are merged in with existing.
		const newOrderMap = processedImages.reduce(
			( result, image, index ) => (
				( result[ image.id ] = index ), result
			),
			{}
		);

		const existingImageBlocks = ! newFileUploads
			? innerBlockImages.filter( ( block ) =>
					processedImages.find(
						( img ) => img.id === block.attributes.id
					)
			  )
			: innerBlockImages;

		const newImageList = processedImages.filter(
			( img ) =>
				! existingImageBlocks.find(
					( existingImg ) => img.id === existingImg.attributes.id
				)
		);

		const newBlocks = newImageList.map( ( image ) => {
			return createBlock( 'core/image', {
				id: image.id,
				url: image.url,
				caption: image.caption,
				alt: image.alt,
			} );
		} );

		replaceInnerBlocks(
			clientId,
			existingImageBlocks
				.concat( newBlocks )
				.sort(
					( a, b ) =>
						newOrderMap[ a.attributes.id ] -
						newOrderMap[ b.attributes.id ]
				)
		);

		// Select the first block to scroll into view when new blocks are added.
		if ( newBlocks?.length > 0 ) {
			selectBlock( newBlocks[ 0 ].clientId );
		}
	}

	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
	}

	function setLinkTo( value ) {
		setAttributes( { linkTo: value } );
		const changedAttributes = {};
		const blocks = [];
		getBlock( clientId ).innerBlocks.forEach( ( block ) => {
			blocks.push( block.clientId );
			const image = block.attributes.id
				? imageData.find( ( { id } ) => id === block.attributes.id )
				: null;
			changedAttributes[ block.clientId ] = getHrefAndDestination(
				image,
				value
			);
		} );
		updateBlockAttributes( blocks, changedAttributes, true );
		const linkToText = [ ...linkOptions ].find(
			( linkType ) => linkType.value === value
		);

		createSuccessNotice(
			sprintf(
				/* translators: %s: image size settings */
				__( 'All gallery image links updated to: %s' ),
				linkToText.label
			),
			{
				id: 'gallery-attributes-linkTo',
				type: 'snackbar',
			}
		);
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

	function toggleRandomOrder() {
		setAttributes( { randomOrder: ! randomOrder } );
	}

	function toggleOpenInNewTab( openInNewTab ) {
		const newLinkTarget = openInNewTab ? '_blank' : undefined;
		setAttributes( { linkTarget: newLinkTarget } );
		const changedAttributes = {};
		const blocks = [];
		getBlock( clientId ).innerBlocks.forEach( ( block ) => {
			blocks.push( block.clientId );
			changedAttributes[ block.clientId ] = getUpdatedLinkTargetSettings(
				newLinkTarget,
				block.attributes
			);
		} );
		updateBlockAttributes( blocks, changedAttributes, true );
		const noticeText = openInNewTab
			? __( 'All gallery images updated to open in new tab' )
			: __( 'All gallery images updated to not open in new tab' );
		createSuccessNotice( noticeText, {
			id: 'gallery-attributes-openInNewTab',
			type: 'snackbar',
		} );
	}

	function updateImagesSize( newSizeSlug ) {
		setAttributes( { sizeSlug: newSizeSlug } );
		const changedAttributes = {};
		const blocks = [];
		getBlock( clientId ).innerBlocks.forEach( ( block ) => {
			blocks.push( block.clientId );
			const image = block.attributes.id
				? imageData.find( ( { id } ) => id === block.attributes.id )
				: null;
			changedAttributes[ block.clientId ] = getImageSizeAttributes(
				image,
				newSizeSlug
			);
		} );
		updateBlockAttributes( blocks, changedAttributes, true );
		const imageSize = imageSizeOptions.find(
			( size ) => size.value === newSizeSlug
		);

		createSuccessNotice(
			sprintf(
				/* translators: %s: image size settings */
				__( 'All gallery image sizes updated to: %s' ),
				imageSize.label
			),
			{
				id: 'gallery-attributes-sizeSlug',
				type: 'snackbar',
			}
		);
	}

	useEffect( () => {
		// linkTo attribute must be saved so blocks don't break when changing image_default_link_type in options.php.
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
	const imagesUploading = images.some( ( img ) =>
		! Platform.isNative
			? ! img.id && img.url?.indexOf( 'blob:' ) === 0
			: img.url?.indexOf( 'file:' ) === 0
	);

	// MediaPlaceholder props are different between web and native hence, we provide a platform-specific set.
	const mediaPlaceholderProps = Platform.select( {
		web: {
			addToGallery: false,
			disableMediaButtons: imagesUploading,
			value: {},
		},
		native: {
			addToGallery: hasImageIds,
			isAppender: hasImages,
			disableMediaButtons:
				( hasImages && ! isSelected ) || imagesUploading,
			value: hasImageIds ? images : {},
			autoOpenMediaUpload:
				! hasImages && isSelected && blockWasJustInserted,
			onFocus,
		},
	} );
	const mediaPlaceholder = (
		<MediaPlaceholder
			handleUpload={ false }
			icon={ sharedIcon }
			labels={ {
				title: __( 'Gallery' ),
				instructions: PLACEHOLDER_TEXT,
			} }
			onSelect={ updateImages }
			accept="image/*"
			allowedTypes={ ALLOWED_MEDIA_TYPES }
			multiple
			onError={ onUploadError }
			{ ...mediaPlaceholderProps }
		/>
	);

	const blockProps = useBlockProps( {
		className: classnames( className, 'has-nested-images' ),
	} );

	const nativeInnerBlockProps = Platform.isNative && {
		marginHorizontal: 0,
		marginVertical: 0,
	};

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		orientation: 'horizontal',
		renderAppender: false,
		...nativeInnerBlockProps,
	} );

	if ( ! hasImages ) {
		return (
			<View { ...innerBlocksProps }>
				{ innerBlocksProps.children }
				{ mediaPlaceholder }
			</View>
		);
	}

	const hasLinkTo = linkTo && linkTo !== 'none';

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					{ images.length > 1 && (
						<RangeControl
							__nextHasNoMarginBottom
							label={ __( 'Columns' ) }
							value={
								columns
									? columns
									: defaultColumnsNumber( images.length )
							}
							onChange={ setColumnsNumber }
							min={ 1 }
							max={ Math.min( MAX_COLUMNS, images.length ) }
							{ ...MOBILE_CONTROL_PROPS_RANGE_CONTROL }
							required
							__next40pxDefaultSize
						/>
					) }
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Crop images' ) }
						checked={ !! imageCrop }
						onChange={ toggleImageCrop }
						help={ getImageCropHelp }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Random order' ) }
						checked={ !! randomOrder }
						onChange={ toggleRandomOrder }
					/>
					<SelectControl
						__nextHasNoMarginBottom
						label={ __( 'Link to' ) }
						value={ linkTo }
						onChange={ setLinkTo }
						options={ linkOptions }
						hideCancelButton={ true }
						size="__unstable-large"
					/>
					{ hasLinkTo && (
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Open in new tab' ) }
							checked={ linkTarget === '_blank' }
							onChange={ toggleOpenInNewTab }
						/>
					) }
					{ imageSizeOptions?.length > 0 && (
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Resolution' ) }
							help={ __(
								'Select the size of the source images.'
							) }
							value={ sizeSlug }
							options={ imageSizeOptions }
							onChange={ updateImagesSize }
							hideCancelButton={ true }
							size="__unstable-large"
						/>
					) }
					{ Platform.isWeb && ! imageSizeOptions && hasImageIds && (
						<BaseControl className={ 'gallery-image-sizes' }>
							<BaseControl.VisualLabel>
								{ __( 'Resolution' ) }
							</BaseControl.VisualLabel>
							<View className={ 'gallery-image-sizes__loading' }>
								<Spinner />
								{ __( 'Loading options…' ) }
							</View>
						</BaseControl>
					) }
				</PanelBody>
			</InspectorControls>
			{ Platform.isWeb && (
				<>
					{ ! multiGallerySelection && (
						<BlockControls group="other">
							<MediaReplaceFlow
								allowedTypes={ ALLOWED_MEDIA_TYPES }
								accept="image/*"
								handleUpload={ false }
								onSelect={ updateImages }
								name={ __( 'Add' ) }
								multiple={ true }
								mediaIds={ images
									.filter( ( image ) => image.id )
									.map( ( image ) => image.id ) }
								addToGallery={ hasImageIds }
							/>
						</BlockControls>
					) }
					<GapStyles
						blockGap={ attributes.style?.spacing?.blockGap }
						clientId={ clientId }
					/>
				</>
			) }
			<Gallery
				{ ...props }
				isContentLocked={ isContentLocked }
				images={ images }
				mediaPlaceholder={
					! hasImages || Platform.isNative
						? mediaPlaceholder
						: undefined
				}
				blockProps={ innerBlocksProps }
				insertBlocksAfter={ insertBlocksAfter }
				multiGallerySelection={ multiGallerySelection }
			/>
		</>
	);
}
export default compose( [ withViewportMatch( { isNarrow: '< small' } ) ] )(
	GalleryEdit
);
