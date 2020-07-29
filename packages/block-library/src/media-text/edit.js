/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import {
	BlockControls,
	BlockVerticalAlignmentToolbar,
	InnerBlocks,
	InspectorControls,
	__experimentalBlock as Block,
	__experimentalImageURLInputUI as ImageURLInputUI,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextareaControl,
	ToggleControl,
	ToolbarGroup,
	ExternalLink,
	FocalPointPicker,
} from '@wordpress/components';
import { pullLeft, pullRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MediaContainer from './media-container';

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

	const image = useSelect(
		( select ) =>
			mediaId && isSelected ? select( 'core' ).getMedia( mediaId ) : null,
		[ isSelected, mediaId ]
	);

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
	const toolbarControls = [
		{
			icon: pullLeft,
			title: __( 'Show media on left' ),
			isActive: mediaPosition === 'left',
			onClick: () => setAttributes( { mediaPosition: 'left' } ),
		},
		{
			icon: pullRight,
			title: __( 'Show media on right' ),
			isActive: mediaPosition === 'right',
			onClick: () => setAttributes( { mediaPosition: 'right' } ),
		},
	];
	const onMediaAltChange = ( newMediaAlt ) => {
		setAttributes( { mediaAlt: newMediaAlt } );
	};
	const onVerticalAlignmentChange = ( alignment ) => {
		setAttributes( { verticalAlignment: alignment } );
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
			{ imageFill && (
				<FocalPointPicker
					label={ __( 'Focal point picker' ) }
					url={ mediaUrl }
					value={ focalPoint }
					onChange={ ( value ) =>
						setAttributes( { focalPoint: value } )
					}
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
		</PanelBody>
	);

	return (
		<>
			<InspectorControls>{ mediaTextGeneralSettings }</InspectorControls>
			<BlockControls>
				<ToolbarGroup controls={ toolbarControls } />
				<BlockVerticalAlignmentToolbar
					onChange={ onVerticalAlignmentChange }
					value={ verticalAlignment }
				/>
				{ mediaType === 'image' && (
					<ToolbarGroup>
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
					</ToolbarGroup>
				) }
			</BlockControls>
			<Block.div className={ classNames } style={ style }>
				<MediaContainer
					className="wp-block-media-text__media"
					onSelectMedia={ onSelectMedia }
					onWidthChange={ onWidthChange }
					commitWidthChange={ commitWidthChange }
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
				<InnerBlocks
					__experimentalTagName="div"
					__experimentalPassedProps={ {
						className: 'wp-block-media-text__content',
					} }
					template={ TEMPLATE }
					templateInsertUpdatesSelection={ false }
				/>
			</Block.div>
		</>
	);
}

export default MediaTextEdit;
