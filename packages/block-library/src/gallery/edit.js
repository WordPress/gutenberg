/**
 * External dependencies
 */
import classnames from 'classnames';
import { concat, find } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import {
	BaseControl,
	PanelBody,
	SelectControl,
	ToggleControl,
	withNotices,
	RangeControl,
	Spinner,
} from '@wordpress/components';
import {
	store as blockEditorStore,
	MediaPlaceholder,
	InspectorControls,
	useBlockProps,
	BlockControls,
	MediaReplaceFlow,
	BlockList,
} from '@wordpress/block-editor';
import {
	Platform,
	useEffect,
	useMemo,
	createPortal,
	useContext,
} from '@wordpress/element';
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
import useShortCodeTransform from './use-short-code-transform';
import useGetNewImages from './use-get-new-images';
import useGetMedia from './use-get-media';

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
	? __( 'ADD MEDIA' )
	: __( 'Drag images, upload new ones or select files from your library.' );

const MOBILE_CONTROL_PROPS_RANGE_CONTROL = Platform.isNative
	? { type: 'stepper' }
	: {};

function GalleryEdit( props ) {
	const {
		setAttributes,
		attributes,
		className,
		clientId,
		noticeOperations,
		isSelected,
		noticeUI,
		insertBlocksAfter,
	} = props;

	const {
		columns,
		imageCrop,
		linkTarget,
		linkTo,
		shortCodeTransforms,
		sizeSlug,
	} = attributes;

	const {
		__unstableMarkNextChangeAsNotPersistent,
		replaceInnerBlocks,
		updateBlockAttributes,
		multiSelect,
	} = useDispatch( blockEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	const { getBlock, getSettings, preferredStyle } = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		const preferredStyleVariations =
			settings.__experimentalPreferredStyleVariations;
		return {
			getBlock: select( blockEditorStore ).getBlock,
			getSettings: select( blockEditorStore ).getSettings,
			preferredStyle: preferredStyleVariations?.value?.[ 'core/image' ],
		};
	}, [] );

	const styleElement = useContext( BlockList.__unstableElementContext );

	const innerBlockImages = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlock( clientId )?.innerBlocks;
		},
		[ clientId ]
	);

	const wasBlockJustInserted = useSelect(
		( select ) => {
			return select( blockEditorStore ).wasBlockJustInserted(
				clientId,
				'inserter_menu'
			);
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
			updateBlockAttributes( newImage.clientId, {
				...buildImageAttributes( newImage.attributes ),
				id: newImage.id,
				align: undefined,
			} );
		} );

		// If new blocks added select the first of these so they scroll into view.
		if ( newImages?.length ) {
			multiSelect(
				newImages[ 0 ].clientId,
				newImages[ newImages?.length - 1 ].clientId
			);
		}
	}, [ newImages ] );

	const shortCodeImages = useShortCodeTransform( shortCodeTransforms );

	useEffect( () => {
		if ( ! shortCodeTransforms || ! shortCodeImages ) {
			return;
		}
		updateImages( shortCodeImages );
		setAttributes( { shortCodeTransforms: undefined } );
	}, [ shortCodeTransforms, shortCodeImages ] );

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
			? find( imageData, { id: imageAttributes.id } )
			: null;

		let newClassName;
		if ( imageAttributes.className && imageAttributes.className !== '' ) {
			newClassName = imageAttributes.className;
		} else {
			newClassName = preferredStyle
				? `is-style-${ preferredStyle }`
				: undefined;
		}
		return {
			...pickRelevantMediaFiles( imageAttributes, sizeSlug ),
			...getHrefAndDestination( image, linkTo ),
			...getUpdatedLinkTargetSettings( linkTarget, attributes ),
			className: newClassName,
			sizeSlug,
		};
	}

	function isValidFileType( file ) {
		return (
			ALLOWED_MEDIA_TYPES.some(
				( mediaType ) => file.type?.indexOf( mediaType ) === 0
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
			noticeOperations.removeAllNotices();
			noticeOperations.createErrorNotice(
				__(
					'If uploading to a gallery all files need to be image formats'
				),
				{ id: 'gallery-upload-invalid-file' }
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
			concat( existingImageBlocks, newBlocks ).sort(
				( a, b ) =>
					newOrderMap[ a.attributes.id ] -
					newOrderMap[ b.attributes.id ]
			)
		);
	}

	function onUploadError( message ) {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	}

	function setLinkTo( value ) {
		setAttributes( { linkTo: value } );
		const changedAttributes = {};
		const blocks = [];
		getBlock( clientId ).innerBlocks.forEach( ( block ) => {
			blocks.push( block.clientId );
			const image = block.attributes.id
				? find( imageData, { id: block.attributes.id } )
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
				? find( imageData, { id: block.attributes.id } )
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
	const imagesUploading = images.some(
		( img ) => ! img.id && img.url?.indexOf( 'blob:' ) === 0
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
				! hasImages && isSelected && wasBlockJustInserted,
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
			notices={ noticeUI }
			{ ...mediaPlaceholderProps }
		/>
	);

	const blockProps = useBlockProps( {
		className: classnames( className, 'has-nested-images' ),
	} );

	if ( ! hasImages ) {
		return <View { ...blockProps }>{ mediaPlaceholder }</View>;
	}

	const hasLinkTo = linkTo && linkTo !== 'none';

	const gap = attributes.style?.spacing?.blockGap
		? `#block-${ clientId } { --wp--style--unstable-gallery-gap: ${ attributes.style.spacing.blockGap } }`
		: `#block-${ clientId } { --wp--style--unstable-gallery-gap: var( --wp--style--block-gap ) }`;

	const GapStyle = () => {
		return <style>{ gap }</style>;
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Gallery settings' ) }>
					{ images.length > 1 && (
						<RangeControl
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
						/>
					) }
					<ToggleControl
						label={ __( 'Crop images' ) }
						checked={ !! imageCrop }
						onChange={ toggleImageCrop }
						help={ getImageCropHelp }
					/>
					<SelectControl
						label={ __( 'Link to' ) }
						value={ linkTo }
						onChange={ setLinkTo }
						options={ linkOptions }
						hideCancelButton={ true }
					/>
					{ hasLinkTo && (
						<ToggleControl
							label={ __( 'Open in new tab' ) }
							checked={ linkTarget === '_blank' }
							onChange={ toggleOpenInNewTab }
						/>
					) }
					{ imageSizeOptions?.length > 0 && (
						<SelectControl
							label={ __( 'Image size' ) }
							value={ sizeSlug }
							options={ imageSizeOptions }
							onChange={ updateImagesSize }
							hideCancelButton={ true }
						/>
					) }
					{ Platform.isWeb && ! imageSizeOptions && hasImageIds && (
						<BaseControl className={ 'gallery-image-sizes' }>
							<BaseControl.VisualLabel>
								{ __( 'Image size' ) }
							</BaseControl.VisualLabel>
							<View className={ 'gallery-image-sizes__loading' }>
								<Spinner />
								{ __( 'Loading options…' ) }
							</View>
						</BaseControl>
					) }
				</PanelBody>
			</InspectorControls>
			<BlockControls group="other">
				<MediaReplaceFlow
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					accept="image/*"
					handleUpload={ false }
					onSelect={ updateImages }
					name={ __( 'Add' ) }
					multiple={ true }
					mediaIds={ images.map( ( image ) => image.id ) }
					addToGallery={ hasImageIds }
				/>
			</BlockControls>
			{ noticeUI }
			{ gap && createPortal( <GapStyle />, styleElement ) }
			<Gallery
				{ ...props }
				images={ images }
				mediaPlaceholder={
					! hasImages || Platform.isNative
						? mediaPlaceholder
						: undefined
				}
				blockProps={ blockProps }
				insertBlocksAfter={ insertBlocksAfter }
			/>
		</>
	);
}
export default compose( [
	withNotices,
	withViewportMatch( { isNarrow: '< small' } ),
] )( GalleryEdit );
