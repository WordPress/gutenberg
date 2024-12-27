/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState, useRef } from '@wordpress/element';
import {
	BlockControls,
	BlockVerticalAlignmentControl,
	useInnerBlocksProps,
	InspectorControls,
	useBlockProps,
	__experimentalImageURLInputUI as ImageURLInputUI,
	store as blockEditorStore,
	useBlockEditingMode,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import {
	RangeControl,
	TextareaControl,
	ToggleControl,
	ToolbarButton,
	ExternalLink,
	FocalPointPicker,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { isBlobURL, getBlobTypeByURL } from '@wordpress/blob';
import { pullLeft, pullRight } from '@wordpress/icons';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import MediaContainer from './media-container';
import {
	DEFAULT_MEDIA_SIZE_SLUG,
	WIDTH_CONSTRAINT_PERCENTAGE,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_ATTACHMENT,
	TEMPLATE,
} from './constants';
import { unlock } from '../lock-unlock';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const { ResolutionTool } = unlock( blockEditorPrivateApis );

// this limits the resize to a safe zone to avoid making broken layouts
const applyWidthConstraints = ( width ) =>
	Math.max(
		WIDTH_CONSTRAINT_PERCENTAGE,
		Math.min( width, 100 - WIDTH_CONSTRAINT_PERCENTAGE )
	);

function getImageSourceUrlBySizeSlug( image, slug ) {
	// eslint-disable-next-line camelcase
	return image?.media_details?.sizes?.[ slug ]?.source_url;
}

function attributesFromMedia( {
	attributes: { linkDestination, href },
	setAttributes,
} ) {
	return ( media ) => {
		if ( ! media || ! media.url ) {
			setAttributes( {
				mediaAlt: undefined,
				mediaId: undefined,
				mediaType: undefined,
				mediaUrl: undefined,
				mediaLink: undefined,
				href: undefined,
				focalPoint: undefined,
				useFeaturedImage: false,
			} );
			return;
		}

		if ( isBlobURL( media.url ) ) {
			media.type = getBlobTypeByURL( media.url );
		}

		let mediaType;
		let src;
		// For media selections originated from a file upload.
		if ( media.media_type ) {
			if ( media.media_type === 'image' ) {
				mediaType = 'image';
			} else {
				// only images and videos are accepted so if the media_type is not an image we can assume it is a video.
				// video contain the media type of 'file' in the object returned from the rest api.
				mediaType = 'video';
			}
		} else {
			// For media selections originated from existing files in the media library.
			mediaType = media.type;
		}

		if ( mediaType === 'image' ) {
			// Try the "large" size URL, falling back to the "full" size URL below.
			src =
				media.sizes?.large?.url ||
				// eslint-disable-next-line camelcase
				media.media_details?.sizes?.large?.source_url;
		}

		let newHref = href;
		if ( linkDestination === LINK_DESTINATION_MEDIA ) {
			// Update the media link.
			newHref = media.url;
		}

		// Check if the image is linked to the attachment page.
		if ( linkDestination === LINK_DESTINATION_ATTACHMENT ) {
			// Update the media link.
			newHref = media.link;
		}

		setAttributes( {
			mediaAlt: media.alt,
			mediaId: media.id,
			mediaType,
			mediaUrl: src || media.url,
			mediaLink: media.link || undefined,
			href: newHref,
			focalPoint: undefined,
			useFeaturedImage: false,
		} );
	};
}

function MediaTextResolutionTool( { image, value, onChange } ) {
	const { imageSizes } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			imageSizes: getSettings().imageSizes,
		};
	}, [] );

	if ( ! imageSizes?.length ) {
		return null;
	}

	const imageSizeOptions = imageSizes
		.filter( ( { slug } ) => getImageSourceUrlBySizeSlug( image, slug ) )
		.map( ( { name, slug } ) => ( { value: slug, label: name } ) );

	return (
		<ResolutionTool
			value={ value }
			defaultValue={ DEFAULT_MEDIA_SIZE_SLUG }
			options={ imageSizeOptions }
			onChange={ onChange }
		/>
	);
}

function MediaTextEdit( {
	attributes,
	isSelected,
	setAttributes,
	context: { postId, postType },
} ) {
	const {
		focalPoint,
		href,
		imageFill,
		isStackedOnMobile,
		linkClass,
		linkDestination,
		linkTarget,
		mediaAlt,
		mediaId,
		mediaPosition,
		mediaType,
		mediaUrl,
		mediaWidth,
		mediaSizeSlug,
		rel,
		verticalAlignment,
		allowedBlocks,
		useFeaturedImage,
	} = attributes;

	const [ featuredImage ] = useEntityProp(
		'postType',
		postType,
		'featured_media',
		postId
	);

	const { featuredImageMedia } = useSelect(
		( select ) => {
			return {
				featuredImageMedia:
					featuredImage && useFeaturedImage
						? select( coreStore ).getMedia( featuredImage, {
								context: 'view',
						  } )
						: undefined,
			};
		},
		[ featuredImage, useFeaturedImage ]
	);

	const { image } = useSelect(
		( select ) => {
			return {
				image:
					mediaId && isSelected
						? select( coreStore ).getMedia( mediaId, {
								context: 'view',
						  } )
						: null,
			};
		},
		[ isSelected, mediaId ]
	);

	const featuredImageURL = useFeaturedImage
		? featuredImageMedia?.source_url
		: '';
	const featuredImageAlt = useFeaturedImage
		? featuredImageMedia?.alt_text
		: '';

	const toggleUseFeaturedImage = () => {
		setAttributes( {
			imageFill: false,
			mediaType: 'image',
			mediaId: undefined,
			mediaUrl: undefined,
			mediaAlt: undefined,
			mediaLink: undefined,
			linkDestination: undefined,
			linkTarget: undefined,
			linkClass: undefined,
			rel: undefined,
			href: undefined,
			useFeaturedImage: ! useFeaturedImage,
		} );
	};

	const refMedia = useRef();
	const imperativeFocalPointPreview = ( value ) => {
		const { style } = refMedia.current;
		const { x, y } = value;
		style.objectPosition = `${ x * 100 }% ${ y * 100 }%`;
	};

	const [ temporaryMediaWidth, setTemporaryMediaWidth ] = useState( null );

	const onSelectMedia = attributesFromMedia( { attributes, setAttributes } );

	const onSetHref = ( props ) => {
		setAttributes( props );
	};

	const onWidthChange = ( width ) => {
		setTemporaryMediaWidth( applyWidthConstraints( width ) );
	};
	const commitWidthChange = ( width ) => {
		setAttributes( {
			mediaWidth: applyWidthConstraints( width ),
		} );
		setTemporaryMediaWidth( null );
	};

	const classNames = clsx( {
		'has-media-on-the-right': 'right' === mediaPosition,
		'is-selected': isSelected,
		'is-stacked-on-mobile': isStackedOnMobile,
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
		'is-image-fill-element': imageFill,
	} );
	const widthString = `${ temporaryMediaWidth || mediaWidth }%`;
	const gridTemplateColumns =
		'right' === mediaPosition
			? `1fr ${ widthString }`
			: `${ widthString } 1fr`;
	const style = {
		gridTemplateColumns,
		msGridColumns: gridTemplateColumns,
	};
	const onMediaAltChange = ( newMediaAlt ) => {
		setAttributes( { mediaAlt: newMediaAlt } );
	};
	const onVerticalAlignmentChange = ( alignment ) => {
		setAttributes( { verticalAlignment: alignment } );
	};
	const updateImage = ( newMediaSizeSlug ) => {
		const newUrl = getImageSourceUrlBySizeSlug( image, newMediaSizeSlug );

		if ( ! newUrl ) {
			return null;
		}

		setAttributes( {
			mediaUrl: newUrl,
			mediaSizeSlug: newMediaSizeSlug,
		} );
	};
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const mediaTextGeneralSettings = (
		<ToolsPanel
			label={ __( 'Settings' ) }
			resetAll={ () => {
				setAttributes( {
					isStackedOnMobile: true,
					imageFill: false,
					mediaAlt: '',
					focalPoint: undefined,
					mediaWidth: 50,
					mediaSizeSlug: undefined,
				} );
			} }
			dropdownMenuProps={ dropdownMenuProps }
		>
			<ToolsPanelItem
				label={ __( 'Media width' ) }
				isShownByDefault
				hasValue={ () => mediaWidth !== 50 }
				onDeselect={ () => setAttributes( { mediaWidth: 50 } ) }
			>
				<RangeControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Media width' ) }
					value={ temporaryMediaWidth || mediaWidth }
					onChange={ commitWidthChange }
					min={ WIDTH_CONSTRAINT_PERCENTAGE }
					max={ 100 - WIDTH_CONSTRAINT_PERCENTAGE }
				/>
			</ToolsPanelItem>
			<ToolsPanelItem
				label={ __( 'Stack on mobile' ) }
				isShownByDefault
				hasValue={ () => ! isStackedOnMobile }
				onDeselect={ () =>
					setAttributes( { isStackedOnMobile: true } )
				}
			>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Stack on mobile' ) }
					checked={ isStackedOnMobile }
					onChange={ () =>
						setAttributes( {
							isStackedOnMobile: ! isStackedOnMobile,
						} )
					}
				/>
			</ToolsPanelItem>
			{ mediaType === 'image' && (
				<ToolsPanelItem
					label={ __( 'Crop image to fill' ) }
					isShownByDefault
					hasValue={ () => !! imageFill }
					onDeselect={ () => setAttributes( { imageFill: false } ) }
				>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Crop image to fill' ) }
						checked={ !! imageFill }
						onChange={ () =>
							setAttributes( {
								imageFill: ! imageFill,
							} )
						}
					/>
				</ToolsPanelItem>
			) }
			{ imageFill &&
				( mediaUrl || featuredImageURL ) &&
				mediaType === 'image' && (
					<ToolsPanelItem
						label={ __( 'Focal point' ) }
						isShownByDefault
						hasValue={ () => !! focalPoint }
						onDeselect={ () =>
							setAttributes( { focalPoint: undefined } )
						}
					>
						<FocalPointPicker
							__nextHasNoMarginBottom
							label={ __( 'Focal point' ) }
							url={
								useFeaturedImage && featuredImageURL
									? featuredImageURL
									: mediaUrl
							}
							value={ focalPoint }
							onChange={ ( value ) =>
								setAttributes( { focalPoint: value } )
							}
							onDragStart={ imperativeFocalPointPreview }
							onDrag={ imperativeFocalPointPreview }
						/>
					</ToolsPanelItem>
				) }
			{ mediaType === 'image' && mediaUrl && ! useFeaturedImage && (
				<ToolsPanelItem
					label={ __( 'Alternative text' ) }
					isShownByDefault
					hasValue={ () => !! mediaAlt }
					onDeselect={ () => setAttributes( { mediaAlt: '' } ) }
				>
					<TextareaControl
						__nextHasNoMarginBottom
						label={ __( 'Alternative text' ) }
						value={ mediaAlt }
						onChange={ onMediaAltChange }
						help={
							<>
								<ExternalLink
									href={
										// translators: Localized tutorial, if one exists. W3C Web Accessibility Initiative link has list of existing translations.
										__(
											'https://www.w3.org/WAI/tutorials/images/decision-tree/'
										)
									}
								>
									{ __(
										'Describe the purpose of the image.'
									) }
								</ExternalLink>
								<br />
								{ __( 'Leave empty if decorative.' ) }
							</>
						}
					/>
				</ToolsPanelItem>
			) }
			{ mediaType === 'image' && ! useFeaturedImage && (
				<MediaTextResolutionTool
					image={ image }
					value={ mediaSizeSlug }
					onChange={ updateImage }
				/>
			) }
		</ToolsPanel>
	);

	const blockProps = useBlockProps( {
		className: classNames,
		style,
	} );

	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'wp-block-media-text__content' },
		{ template: TEMPLATE, allowedBlocks }
	);

	const blockEditingMode = useBlockEditingMode();

	return (
		<>
			<InspectorControls>{ mediaTextGeneralSettings }</InspectorControls>
			<BlockControls group="block">
				{ blockEditingMode === 'default' && (
					<>
						<BlockVerticalAlignmentControl
							onChange={ onVerticalAlignmentChange }
							value={ verticalAlignment }
						/>
						<ToolbarButton
							icon={ pullLeft }
							title={ __( 'Show media on left' ) }
							isActive={ mediaPosition === 'left' }
							onClick={ () =>
								setAttributes( { mediaPosition: 'left' } )
							}
						/>
						<ToolbarButton
							icon={ pullRight }
							title={ __( 'Show media on right' ) }
							isActive={ mediaPosition === 'right' }
							onClick={ () =>
								setAttributes( { mediaPosition: 'right' } )
							}
						/>
					</>
				) }

				{ mediaType === 'image' && ! useFeaturedImage && (
					<ImageURLInputUI
						url={ href || '' }
						onChangeUrl={ onSetHref }
						linkDestination={ linkDestination }
						mediaType={ mediaType }
						mediaUrl={ image && image.source_url }
						mediaLink={ image && image.link }
						linkTarget={ linkTarget }
						linkClass={ linkClass }
						rel={ rel }
					/>
				) }
			</BlockControls>
			<div { ...blockProps }>
				{ mediaPosition === 'right' && <div { ...innerBlocksProps } /> }
				<MediaContainer
					className="wp-block-media-text__media"
					onSelectMedia={ onSelectMedia }
					onWidthChange={ onWidthChange }
					commitWidthChange={ commitWidthChange }
					refMedia={ refMedia }
					enableResize={ blockEditingMode === 'default' }
					toggleUseFeaturedImage={ toggleUseFeaturedImage }
					{ ...{
						focalPoint,
						imageFill,
						isSelected,
						isStackedOnMobile,
						mediaAlt,
						mediaId,
						mediaPosition,
						mediaType,
						mediaUrl,
						mediaWidth,
						useFeaturedImage,
						featuredImageURL,
						featuredImageAlt,
					} }
				/>
				{ mediaPosition !== 'right' && <div { ...innerBlocksProps } /> }
			</div>
		</>
	);
}

export default MediaTextEdit;
