/**
 * External dependencies
 */
import classnames from 'classnames';
import { map, filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState, useRef } from '@wordpress/element';
import {
	BlockControls,
	BlockVerticalAlignmentControl,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	InspectorControls,
	useBlockProps,
	__experimentalImageURLInputUI as ImageURLInputUI,
	__experimentalImageSizeControl as ImageSizeControl,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	TextareaControl,
	ToggleControl,
	ToolbarButton,
	ExternalLink,
	FocalPointPicker,
} from '@wordpress/components';
import { pullLeft, pullRight } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import MediaContainer from './media-container';
import { DEFAULT_MEDIA_SIZE_SLUG } from './constants';

/**
 * Constants
 */
const TEMPLATE = [
	[
		'core/paragraph',
		{
			fontSize: 'large',
			placeholder: _x( 'Content…', 'content placeholder' ),
		},
	],
];

// this limits the resize to a safe zone to avoid making broken layouts
const WIDTH_CONSTRAINT_PERCENTAGE = 15;
const applyWidthConstraints = ( width ) =>
	Math.max(
		WIDTH_CONSTRAINT_PERCENTAGE,
		Math.min( width, 100 - WIDTH_CONSTRAINT_PERCENTAGE )
	);

const LINK_DESTINATION_MEDIA = 'media';
const LINK_DESTINATION_ATTACHMENT = 'attachment';

function getImageSourceUrlBySizeSlug( image, slug ) {
	// eslint-disable-next-line camelcase
	return image?.media_details?.sizes?.[ slug ]?.source_url;
}

function attributesFromMedia( {
	attributes: { linkDestination, href },
	setAttributes,
} ) {
	return ( media ) => {
		let mediaType;
		let src;
		// for media selections originated from a file upload.
		if ( media.media_type ) {
			if ( media.media_type === 'image' ) {
				mediaType = 'image';
			} else {
				// only images and videos are accepted so if the media_type is not an image we can assume it is a video.
				// video contain the media type of 'file' in the object returned from the rest api.
				mediaType = 'video';
			}
		} else {
			// for media selections originated from existing files in the media library.
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
	} = attributes;
	const mediaSizeSlug = attributes.mediaSizeSlug || DEFAULT_MEDIA_SIZE_SLUG;

	const image = useSelect(
		( select ) =>
			mediaId && isSelected
				? select( coreStore ).getMedia( mediaId )
				: null,
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
		setTemporaryMediaWidth( applyWidthConstraints( width ) );
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

	const imageSizes = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return settings?.imageSizes;
	} );
	const imageSizeOptions = map(
		filter( imageSizes, ( { slug } ) =>
			getImageSourceUrlBySizeSlug( image, slug )
		),
		( { name, slug } ) => ( { value: slug, label: name } )
	);
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

	const mediaTextGeneralSettings = (
		<PanelBody title={ __( 'Media & Text settings' ) }>
			<ToggleControl
				label={ __( 'Stack on mobile' ) }
				checked={ isStackedOnMobile }
				onChange={ () =>
					setAttributes( {
						isStackedOnMobile: ! isStackedOnMobile,
					} )
				}
			/>
			{ mediaType === 'image' && (
				<ToggleControl
					label={ __( 'Crop image to fill entire column' ) }
					checked={ imageFill }
					onChange={ () =>
						setAttributes( {
							imageFill: ! imageFill,
						} )
					}
				/>
			) }
			{ imageFill && mediaUrl && mediaType === 'image' && (
				<FocalPointPicker
					label={ __( 'Focal point picker' ) }
					url={ mediaUrl }
					value={ focalPoint }
					onChange={ ( value ) =>
						setAttributes( { focalPoint: value } )
					}
					onDragStart={ imperativeFocalPointPreview }
					onDrag={ imperativeFocalPointPreview }
				/>
			) }
			{ mediaType === 'image' && (
				<TextareaControl
					label={ __( 'Alt text (alternative text)' ) }
					value={ mediaAlt }
					onChange={ onMediaAltChange }
					help={
						<>
							<ExternalLink href="https://www.w3.org/WAI/tutorials/images/decision-tree">
								{ __( 'Describe the purpose of the image' ) }
							</ExternalLink>
							{ __(
								'Leave empty if the image is purely decorative.'
							) }
						</>
					}
				/>
			) }
			{ mediaType === 'image' && (
				<ImageSizeControl
					onChangeImage={ updateImage }
					slug={ mediaSizeSlug }
					imageSizeOptions={ imageSizeOptions }
					isResizable={ false }
				/>
			) }
			{ mediaUrl && (
				<RangeControl
					label={ __( 'Media width' ) }
					value={ temporaryMediaWidth || mediaWidth }
					onChange={ commitWidthChange }
					min={ WIDTH_CONSTRAINT_PERCENTAGE }
					max={ 100 - WIDTH_CONSTRAINT_PERCENTAGE }
				/>
			) }
		</PanelBody>
	);

	const blockProps = useBlockProps( {
		className: classNames,
		style,
	} );

	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'wp-block-media-text__content' },
		{ template: TEMPLATE }
	);

	return (
		<>
			<InspectorControls>{ mediaTextGeneralSettings }</InspectorControls>
			<BlockControls group="block">
				<BlockVerticalAlignmentControl
					onChange={ onVerticalAlignmentChange }
					value={ verticalAlignment }
				/>
				<ToolbarButton
					icon={ pullLeft }
					title={ __( 'Show media on left' ) }
					isActive={ mediaPosition === 'left' }
					onClick={ () => setAttributes( { mediaPosition: 'left' } ) }
				/>
				<ToolbarButton
					icon={ pullRight }
					title={ __( 'Show media on right' ) }
					isActive={ mediaPosition === 'right' }
					onClick={ () =>
						setAttributes( { mediaPosition: 'right' } )
					}
				/>
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
				<MediaContainer
					className="wp-block-media-text__media"
					onSelectMedia={ onSelectMedia }
					onWidthChange={ onWidthChange }
					commitWidthChange={ commitWidthChange }
					ref={ refMediaContainer }
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
					} }
				/>
				<div { ...innerBlocksProps } />
			</div>
		</>
	);
}

export default MediaTextEdit;
