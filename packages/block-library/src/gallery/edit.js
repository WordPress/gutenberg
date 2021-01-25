/**
 * External dependencies
 */
import classnames from 'classnames';
import { isEmpty, concat, differenceBy, some, every } from 'lodash';

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
	MediaPlaceholder,
	InspectorControls,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Platform, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';
import { View } from '@wordpress/primitives';
import { createBlock } from '@wordpress/blocks';
import { createBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import { sharedIcon } from './shared-icon';
import { defaultColumnsNumber, pickRelevantMediaFiles } from './shared';
import { getHrefAndDestination } from './utils';
import { getUpdatedLinkTargetSettings } from '../image/utils';
import Gallery from './gallery';
import {
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_NONE,
} from './constants';
import useImageSizes from './use-image-sizes';
import useShortCodeTransform from './use-short-code-transform';

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

const DEFAULT_GUTTER_SIZE = 16;
const MAX_GUTTER_SIZE = 100;
const MIN_GUTTER_SIZE = 0;

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
		imageCount,
		columns = defaultColumnsNumber( imageCount ),
		gutterSize,
		imageCrop,
		imageUploads,
		linkTarget,
		linkTo,
		shortCodeTransforms,
		sizeSlug,
	} = attributes;

	const {
		__unstableMarkNextChangeAsNotPersistent,
		replaceInnerBlocks,
	} = useDispatch( 'core/block-editor' );

	const { getSettings, preferredStyle } = useSelect( ( select ) => {
		const settings = select( 'core/block-editor' ).getSettings();
		const preferredStyleVariations =
			settings.__experimentalPreferredStyleVariations;
		return {
			getBlock: select( 'core/block-editor' ).getBlock,
			getSettings: select( 'core/block-editor' ).getSettings,
			preferredStyle: preferredStyleVariations?.value?.[ 'core/image' ],
		};
	}, [] );

	const innerBlockImages = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getBlock( clientId )?.innerBlocks;
	} );

	const images = useMemo(
		() =>
			innerBlockImages?.map( ( block ) => ( {
				id: block.attributes.id,
				url: block.attributes.url,
				attributes: block.attributes,
			} ) ),
		[ innerBlockImages ]
	);

	const imageData = useSelect(
		( select ) => {
			if (
				! innerBlockImages?.length ||
				some(
					innerBlockImages,
					( imageBlock ) => ! imageBlock.attributes.id
				)
			) {
				return imageData;
			}
			const getMedia = select( 'core' ).getMedia;
			const newImageData = innerBlockImages.map( ( imageBlock ) => {
				return {
					id: imageBlock.attributes.id,
					data: getMedia( imageBlock.attributes.id ),
				};
			} );

			if ( every( newImageData, ( img ) => img.data ) ) {
				return newImageData;
			}

			return imageData;
		},
		[ innerBlockImages ]
	);

	const shortCodeImages = useShortCodeTransform( shortCodeTransforms );

	useEffect( () => {
		if ( ! shortCodeTransforms || ! shortCodeImages ) {
			return;
		}
		onSelectImages( shortCodeImages );
		setAttributes( { shortCodeTransforms: undefined } );
	}, [ shortCodeTransforms, shortCodeImages ] );

	useEffect( () => {
		if ( ! images ) {
			setAttributes( { imageCount: undefined } );
			return;
		}

		if ( images.length !== imageCount ) {
			setAttributes( { imageCount: images.length } );
		}
	}, [ images ] );

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
	 * @param  {Object} existingBlock Existing Image block that still exists after gallery update.
	 * @param  {Object} image         Media object for the actual image.
	 * @return {Object}               Attributes to set on the new image block.
	 */
	function buildImageAttributes( existingBlock, image ) {
		if ( existingBlock ) {
			return existingBlock.attributes;
		}
		return {
			...pickRelevantMediaFiles( image, sizeSlug ),
			...getHrefAndDestination( image, linkTo ),
			...getUpdatedLinkTargetSettings( linkTarget, attributes ),
			className: preferredStyle
				? `is-style-${ preferredStyle }`
				: undefined,
			sizeSlug,
		};
	}

	function onSelectImages( selectedImages, replace = false ) {
		const imageArray =
			Object.prototype.toString.call( selectedImages ) ===
			'[object FileList]'
				? Array.from( selectedImages ).map( ( file ) => {
						if ( ! file.url ) {
							return pickRelevantMediaFiles( {
								url: createBlobURL( file ),
							} );
						}

						return file;
				  } )
				: selectedImages;

		const processedImages = imageArray
			.filter(
				( file ) => file.url || file.type?.indexOf( 'image/' ) === 0
			)
			.map( ( file ) => {
				if ( ! file.url ) {
					return pickRelevantMediaFiles( {
						url: createBlobURL( file ),
					} );
				}

				return file;
			} );

		const existingImageBlocks = replace
			? innerBlockImages.filter( ( block ) =>
					processedImages.find(
						( img ) => img.url === block.attributes.url
					)
			  )
			: innerBlockImages;

		const newImages = differenceBy( processedImages, images, 'url' );

		const newBlocks = newImages.map( ( image ) => {
			return createBlock( 'core/image', {
				...buildImageAttributes( false, image ),
				inheritedAttributes: {
					linkDestination: true,
					linkTarget: true,
					sizeSlug: true,
				},
				id: image.id,
			} );
		} );

		replaceInnerBlocks(
			clientId,
			concat( existingImageBlocks, newBlocks )
		);
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

	function toggleOpenInNewTab() {
		setAttributes( { linkTarget: linkTarget ? undefined : '_blank' } );
	}

	function updateImagesSize( newSizeSlug ) {
		setAttributes( { sizeSlug: newSizeSlug } );
	}

	useEffect( () => {
		if (
			Platform.OS === 'web' &&
			imageUploads &&
			imageUploads.length > 0
		) {
			onSelectImages( imageUploads );
			setAttributes( { imageUploads: undefined } );
		}
	}, [ imageUploads ] );

	useEffect( () => {
		// linkTo attribute must be saved so blocks don't break when changing image_default_link_type in options.php
		if ( ! linkTo ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				linkTo:
					window?.wp?.media?.view?.settings?.defaultProps?.link ||
					LINK_DESTINATION_NONE,
			} );
		}
	}, [ linkTo ] );

	const hasImages = !! images?.length;

	const mediaPlaceholder = (
		<MediaPlaceholder
			addToGallery={ hasImages }
			isGallery={ true }
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
			value={ images }
			onError={ onUploadError }
			notices={ hasImages ? undefined : noticeUI }
		/>
	);

	const blockProps = useBlockProps( {
		className: classnames( className, 'has-nested-images' ),
		style: {
			'--gallery-block--gutter-size':
				gutterSize !== undefined && `${ gutterSize }px`,
		},
	} );

	if ( ! hasImages ) {
		return <View { ...blockProps }>{ mediaPlaceholder }</View>;
	}

	const shouldShowSizeOptions = ! isEmpty( imageSizeOptions );
	const hasLinkTo = linkTo && linkTo !== 'none';

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Gallery settings' ) }>
					{ images.length > 1 && (
						<RangeControl
							label={ __( 'Columns' ) }
							value={ columns }
							onChange={ setColumnsNumber }
							min={ 1 }
							max={ Math.min( MAX_COLUMNS, images.length ) }
							{ ...MOBILE_CONTROL_PROPS_RANGE_CONTROL }
							required
						/>
					) }
					<RangeControl
						label={ __( 'Gutter size' ) }
						value={ gutterSize }
						onChange={ ( newGutterSize ) =>
							setAttributes( { gutterSize: newGutterSize } )
						}
						initialPosition={ DEFAULT_GUTTER_SIZE }
						min={ MIN_GUTTER_SIZE }
						max={ MAX_GUTTER_SIZE }
						{ ...MOBILE_CONTROL_PROPS_RANGE_CONTROL }
						resetFallbackValue={ DEFAULT_GUTTER_SIZE }
						allowReset
					/>
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
					/>
					{ hasLinkTo && (
						<ToggleControl
							label={ __( 'Open in new tab' ) }
							checked={ linkTarget === '_blank' }
							onChange={ toggleOpenInNewTab }
						/>
					) }
					{ shouldShowSizeOptions ? (
						<SelectControl
							label={ __( 'Image size' ) }
							value={ sizeSlug }
							options={ imageSizeOptions }
							onChange={ updateImagesSize }
						/>
					) : (
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
			{ noticeUI }
			<Gallery
				{ ...props }
				images={ images }
				mediaPlaceholder={ mediaPlaceholder }
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
