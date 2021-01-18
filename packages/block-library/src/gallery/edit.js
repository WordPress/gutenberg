/**
 * External dependencies
 */
<<<<<<< HEAD
import {
	isEqual,
	isEmpty,
	find,
	concat,
	differenceBy,
	some,
	every,
} from 'lodash';
=======
import classnames from 'classnames';
import { isEmpty, concat, differenceBy, some, every } from 'lodash';
>>>>>>> f5e1485f1cbc83de9f6998d6fe4ce59b4aa4e826

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
} from '@wordpress/block-editor';
<<<<<<< HEAD
import { Platform, useEffect, useState, useMemo } from '@wordpress/element';
=======
import { Platform, useEffect, useMemo } from '@wordpress/element';
>>>>>>> f5e1485f1cbc83de9f6998d6fe4ce59b4aa4e826
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
<<<<<<< HEAD
import { getHrefAndDestination, getImageSizeAttributes } from './utils';
=======
import { getHrefAndDestination } from './utils';
>>>>>>> f5e1485f1cbc83de9f6998d6fe4ce59b4aa4e826
import { getUpdatedLinkTargetSettings } from '../image/utils';
import Gallery from './gallery';
import DirtyImageOptions from './dirty-image-options';

import {
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_NONE,
} from './constants';
import useImageSizes from './use-image-sizes';

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
		setAttributes,
		attributes,
<<<<<<< HEAD
=======
		className,
>>>>>>> f5e1485f1cbc83de9f6998d6fe4ce59b4aa4e826
		clientId,
		noticeOperations,
		isSelected,
		noticeUI,
		insertBlocksAfter,
	} = props;

	const {
		imageCount,
		linkTarget,
<<<<<<< HEAD
		linkTo = Platform.OS !== 'web' ? 'none' : undefined,
=======
		linkTo,
>>>>>>> f5e1485f1cbc83de9f6998d6fe4ce59b4aa4e826
		columns = defaultColumnsNumber( imageCount ),
		sizeSlug,
		imageUploads,
		imageCrop,
	} = attributes;

	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch(
		'core/block-editor'
	);

<<<<<<< HEAD
	const currentImageOptions = useMemo(
		() => ( {
			linkTarget,
			linkTo,
			sizeSlug,
		} ),
		[ linkTarget, linkTo, sizeSlug ]
	);
	const [ imageSettings, setImageSettings ] = useState( currentImageOptions );
	const [ dirtyImageOptions, setDirtyImageOptions ] = useState( false );

	useEffect( () => {
		const currentOptionsState = ! isEqual(
			currentImageOptions,
			imageSettings
		);
		if ( currentOptionsState !== dirtyImageOptions ) {
			setDirtyImageOptions( currentOptionsState );
		}
	}, [ currentImageOptions, imageSettings ] );

	const { getBlock, getSettings } = useSelect( ( select ) => {
		return {
			getBlock: select( 'core/block-editor' ).getBlock,
			getSettings: select( 'core/block-editor' ).getSettings,
=======
	const { getSettings, preferredStyle } = useSelect( ( select ) => {
		const settings = select( 'core/block-editor' ).getSettings();
		const preferredStyleVariations =
			settings.__experimentalPreferredStyleVariations;
		return {
			getBlock: select( 'core/block-editor' ).getBlock,
			getSettings: select( 'core/block-editor' ).getSettings,
			preferredStyle: preferredStyleVariations?.value?.[ 'core/image' ],
>>>>>>> f5e1485f1cbc83de9f6998d6fe4ce59b4aa4e826
		};
	}, [] );

	const innerBlockImages = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getBlock( clientId ).innerBlocks;
	} );

	const images = useMemo(
		() =>
			innerBlockImages.map( ( block ) => ( {
				id: block.attributes.id,
				url: block.attributes.url,
				attributes: block.attributes,
			} ) ),
		[ innerBlockImages ]
	);

	const imageData = useSelect(
		( select ) => {
			if (
				innerBlockImages.length === 0 ||
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

	useEffect( () => {
		if ( images.length !== imageCount ) {
			setAttributes( { imageCount: images.length } );
		}
	}, [ images ] );

	const imageSizeOptions = useImageSizes(
		imageData,
		isSelected,
		getSettings
	);
<<<<<<< HEAD

	const { replaceInnerBlocks, updateBlockAttributes } = useDispatch(
		'core/block-editor'
	);

=======

	const { replaceInnerBlocks } = useDispatch( 'core/block-editor' );

>>>>>>> f5e1485f1cbc83de9f6998d6fe4ce59b4aa4e826
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
<<<<<<< HEAD
=======
			className: preferredStyle
				? `is-style-${ preferredStyle }`
				: undefined,
>>>>>>> f5e1485f1cbc83de9f6998d6fe4ce59b4aa4e826
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
<<<<<<< HEAD
=======
				inheritedAttributes: {
					linkDestination: true,
					linkTarget: true,
					sizeSlug: true,
				},
>>>>>>> f5e1485f1cbc83de9f6998d6fe4ce59b4aa4e826
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
<<<<<<< HEAD
	}

	function applyImageOptions() {
		getBlock( clientId ).innerBlocks.forEach( ( block ) => {
			const image = block.attributes.id
				? find( imageData, { id: block.attributes.id } )
				: null;
			updateBlockAttributes( block.clientId, {
				...getHrefAndDestination( image.data, linkTo ),
				...getUpdatedLinkTargetSettings( linkTarget, block.attributes ),
				...getImageSizeAttributes( image.data, sizeSlug ),
			} );
		} );
		setDirtyImageOptions( false );
		setImageSettings( currentImageOptions );
	}

	function cancelImageOptions() {
		setAttributes( imageSettings );
=======
>>>>>>> f5e1485f1cbc83de9f6998d6fe4ce59b4aa4e826
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

	const hasImages = !! images.length;

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
					<DirtyImageOptions
						isVisible={ dirtyImageOptions }
						applyImageOptions={ applyImageOptions }
						cancelImageOptions={ cancelImageOptions }
					/>
				</PanelBody>
			</InspectorControls>
			{ noticeUI }
			<Gallery
				{ ...props }
				images={ images }
				mediaPlaceholder={ mediaPlaceholder }
				blockProps={ blockProps }
				insertBlocksAfter={ insertBlocksAfter }
<<<<<<< HEAD
				imageCrop={ imageCrop }
=======
>>>>>>> f5e1485f1cbc83de9f6998d6fe4ce59b4aa4e826
			/>
		</>
	);
}
export default compose( [
	withNotices,
	withViewportMatch( { isNarrow: '< small' } ),
] )( GalleryEdit );
