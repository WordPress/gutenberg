/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
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
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { isBlobURL, getBlobTypeByURL } from '@wordpress/blob';
import { pullLeft, pullRight } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';

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

const { DimensionsTool, ResolutionTool } = unlock( blockEditorPrivateApis );

const scaleOptions = [
	{
		value: 'cover',
		label: _x( 'Cover', 'Scale option for dimensions control' ),
		help: __( 'Image covers the space evenly.' ),
	},
	{
		value: 'contain',
		label: _x( 'Contain', 'Scale option for dimensions control' ),
		help: __( 'Image is contained without distortion.' ),
	},
];

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
		} );
	};
}

function MediaTextEdit( { attributes, isSelected, setAttributes } ) {
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
		rel,
		verticalAlignment,
		allowedBlocks,
		imageWidth,
		imageHeight,
		imageScale,
		imageAspectRatio,
	} = attributes;
	const mediaSizeSlug = attributes.mediaSizeSlug || DEFAULT_MEDIA_SIZE_SLUG;

	const { imageSizes, image } = useSelect(
		( select ) => {
			const { getSettings } = select( blockEditorStore );
			return {
				image:
					mediaId && isSelected
						? select( coreStore ).getMedia( mediaId, {
								context: 'view',
						  } )
						: null,
				imageSizes: getSettings()?.imageSizes,
			};
		},
		[ isSelected, mediaId ]
	);

	const refMediaContainer = useRef();
	const imperativeFocalPointPreview = ( value ) => {
		const { style } = refMediaContainer.current.resizable;
		const { x, y } = value;
		style.backgroundPosition = `${ x * 100 }% ${ y * 100 }%`;
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

	const classNames = classnames( {
		'has-media-on-the-right': 'right' === mediaPosition,
		'is-selected': isSelected,
		'is-stacked-on-mobile': isStackedOnMobile,
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
		'is-image-fill': imageFill,
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

	const imageSizeOptions = imageSizes
		.filter( ( { slug } ) => getImageSourceUrlBySizeSlug( image, slug ) )
		.map( ( { name, slug } ) => ( { value: slug, label: name } ) );
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

	// TODO: Can allow more units after figuring out how they should interact
	// with the ResizableBox and ImageEditor components. Calculations later on
	// for those components are currently assuming px units.
	const dimensionsUnitsOptions = useCustomUnits( {
		availableUnits: [ 'px' ],
	} );

	const mediaTextGeneralSettings = (
		<ToolsPanel label={ __( 'Settings' ) }>
			<ToolsPanelItem
				label={ __( 'Stack on mobile' ) }
				isShownByDefault={ true }
				hasValue={ () => isStackedOnMobile === true }
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
					label={ __( 'Crop image to fill entire column' ) }
					isShownByDefault={ true }
					hasValue={ () => imageFill === true }
					onDeselect={ () =>
						setAttributes( { imageFill: undefined } )
					}
				>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Crop image to fill entire column' ) }
						checked={ imageFill }
						onChange={ () =>
							setAttributes( {
								imageFill: ! imageFill,
							} )
						}
					/>
				</ToolsPanelItem>
			) }
			{ imageFill && mediaUrl && mediaType === 'image' && (
				<ToolsPanelItem
					label={ __( 'Focal point picker' ) }
					isShownByDefault={ false }
					hasValue={ () => focalPoint !== undefined }
					onDeselect={ () =>
						setAttributes( { focalPoint: undefined } )
					}
				>
					<FocalPointPicker
						__nextHasNoMarginBottom
						label={ __( 'Focal point picker' ) }
						url={ mediaUrl }
						value={ focalPoint }
						onChange={ ( value ) =>
							setAttributes( { focalPoint: value } )
						}
						onDragStart={ imperativeFocalPointPreview }
						onDrag={ imperativeFocalPointPreview }
					/>
				</ToolsPanelItem>
			) }
			{ mediaType === 'image' && (
				<ToolsPanelItem
					label={ __( 'Alternative text' ) }
					isShownByDefault={ true }
					hasValue={ () => !!! mediaAlt }
					onDeselect={ () =>
						setAttributes( { mediaAlt: undefined } )
					}
				>
					<TextareaControl
						__nextHasNoMarginBottom
						label={ __( 'Alternative text' ) }
						value={ mediaAlt }
						onChange={ onMediaAltChange }
						help={
							<>
								<ExternalLink href="https://www.w3.org/WAI/tutorials/images/decision-tree">
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
			{ mediaType === 'image' && ! imageFill && (
				<>
					<DimensionsTool
						value={ {
							width: imageWidth,
							height: imageHeight,
							scale: imageScale,
							aspectRation: imageAspectRatio,
						} }
						onChange={ ( {
							width: newWidth,
							height: newHeight,
							scale: newScale,
							aspectRatio: newAspectRatio,
						} ) => {
							// Rebuilding the object forces setting `undefined`
							// for values that are removed since setAttributes
							// doesn't do anything with keys that aren't set.
							setAttributes( {
								// CSS includes `height: auto`, but we need
								// `width: auto` to fix the aspect ratio when
								// only height is set due to the width and
								// height attributes set via the server.
								imageWidth:
									! newWidth && newHeight ? 'auto' : newWidth,
								imageHeight: newHeight,
								imageScale: newScale,
								imageAspectRatio: newAspectRatio,
							} );
						} }
						defaultScale="cover"
						defaultAspectRatio="auto"
						scaleOptions={ scaleOptions }
						unitsOptions={ dimensionsUnitsOptions }
					/>
					<ResolutionTool
						value={ mediaSizeSlug }
						onChange={ updateImage }
						options={ imageSizeOptions }
					/>
				</>
			) }
			{ mediaUrl && (
				<ToolsPanelItem
					label={ __( 'Media width' ) }
					isShownByDefault={ true }
					hasValue={ () => mediaWidth > 0 }
					onDeselect={ () =>
						setAttributes( { mediaWidth: undefined } )
					}
				>
					<RangeControl
						__nextHasNoMarginBottom
						label={ __( 'Media width' ) }
						value={ temporaryMediaWidth || mediaWidth }
						onChange={ commitWidthChange }
						min={ WIDTH_CONSTRAINT_PERCENTAGE }
						max={ 100 - WIDTH_CONSTRAINT_PERCENTAGE }
					/>
				</ToolsPanelItem>
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

				{ mediaType === 'image' && (
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
					ref={ refMediaContainer }
					enableResize={ blockEditingMode === 'default' }
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
						imageWidth,
						imageHeight,
						imageScale,
						imageAspectRatio,
					} }
				/>
				{ mediaPosition !== 'right' && <div { ...innerBlocksProps } /> }
			</div>
		</>
	);
}

export default MediaTextEdit;
