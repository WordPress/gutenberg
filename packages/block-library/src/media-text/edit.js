/**
 * External dependencies
 */
import classnames from 'classnames';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import {
	BlockControls,
	BlockVerticalAlignmentToolbar,
	InnerBlocks,
	InspectorControls,
	PanelColorSettings,
	withColors,
	__experimentalImageURLInputUI as ImageURLInputUI,
} from '@wordpress/block-editor';
import { Component } from '@wordpress/element';
import {
	PanelBody,
	TextareaControl,
	ToggleControl,
	ToolbarGroup,
	ExternalLink,
	FocalPointPicker,
} from '@wordpress/components';
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

class MediaTextEdit extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectMedia = this.onSelectMedia.bind( this );
		this.onWidthChange = this.onWidthChange.bind( this );
		this.commitWidthChange = this.commitWidthChange.bind( this );
		this.state = {
			mediaWidth: null,
		};
		this.onSetHref = this.onSetHref.bind( this );
	}

	onSelectMedia( media ) {
		const { setAttributes } = this.props;
		const { linkDestination, href } = this.props.attributes;

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
				get( media, [ 'sizes', 'large', 'url' ] ) ||
				get( media, [
					'media_details',
					'sizes',
					'large',
					'source_url',
				] );
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
	}

	onWidthChange( width ) {
		this.setState( {
			mediaWidth: applyWidthConstraints( width ),
		} );
	}

	onSetHref( props ) {
		this.props.setAttributes( props );
	}

	commitWidthChange( width ) {
		const { setAttributes } = this.props;

		setAttributes( {
			mediaWidth: applyWidthConstraints( width ),
		} );
		this.setState( {
			mediaWidth: null,
		} );
	}

	renderMediaArea() {
		const { attributes } = this.props;
		const {
			mediaAlt,
			mediaId,
			mediaPosition,
			mediaType,
			mediaUrl,
			mediaWidth,
			imageFill,
			focalPoint,
		} = attributes;
		return (
			<MediaContainer
				className="block-library-media-text__media-container"
				onSelectMedia={ this.onSelectMedia }
				onWidthChange={ this.onWidthChange }
				commitWidthChange={ this.commitWidthChange }
				{ ...{
					mediaAlt,
					mediaId,
					mediaType,
					mediaUrl,
					mediaPosition,
					mediaWidth,
					imageFill,
					focalPoint,
				} }
			/>
		);
	}

	render() {
		const {
			attributes,
			className,
			backgroundColor,
			isSelected,
			setAttributes,
			setBackgroundColor,
			image,
		} = this.props;
		const {
			isStackedOnMobile,
			mediaAlt,
			mediaPosition,
			mediaType,
			mediaWidth,
			verticalAlignment,
			mediaUrl,
			imageFill,
			focalPoint,
			rel,
			href,
			linkTarget,
			linkClass,
			linkDestination,
		} = attributes;

		const temporaryMediaWidth = this.state.mediaWidth;
		const classNames = classnames( className, {
			'has-media-on-the-right': 'right' === mediaPosition,
			'is-selected': isSelected,
			'has-background': backgroundColor.class || backgroundColor.color,
			[ backgroundColor.class ]: backgroundColor.class,
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
			backgroundColor: backgroundColor.color,
		};
		const colorSettings = [
			{
				value: backgroundColor.color,
				onChange: setBackgroundColor,
				label: __( 'Background Color' ),
			},
		];
		const toolbarControls = [
			{
				icon: 'align-pull-left',
				title: __( 'Show media on left' ),
				isActive: mediaPosition === 'left',
				onClick: () => setAttributes( { mediaPosition: 'left' } ),
			},
			{
				icon: 'align-pull-right',
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
						label={ __( 'Focal Point Picker' ) }
						url={ mediaUrl }
						value={ focalPoint }
						onChange={ ( value ) =>
							setAttributes( { focalPoint: value } )
						}
					/>
				) }
				{ mediaType === 'image' && (
					<TextareaControl
						label={ __( 'Alt Text (Alternative Text)' ) }
						value={ mediaAlt }
						onChange={ onMediaAltChange }
						help={
							<>
								<ExternalLink href="https://www.w3.org/WAI/tutorials/images/decision-tree">
									{ __(
										'Describe the purpose of the image'
									) }
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
				<InspectorControls>
					{ mediaTextGeneralSettings }
					<PanelColorSettings
						title={ __( 'Color settings' ) }
						initialOpen={ false }
						colorSettings={ colorSettings }
					/>
				</InspectorControls>
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
								onChangeUrl={ this.onSetHref }
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
				<div className={ classNames } style={ style }>
					{ this.renderMediaArea() }
					<InnerBlocks
						template={ TEMPLATE }
						templateInsertUpdatesSelection={ false }
					/>
				</div>
			</>
		);
	}
}

export default compose( [
	withColors( 'backgroundColor' ),
	withSelect( ( select, props ) => {
		const { getMedia } = select( 'core' );
		const {
			attributes: { mediaId },
			isSelected,
		} = props;
		return {
			image: mediaId && isSelected ? getMedia( mediaId ) : null,
		};
	} ),
] )( MediaTextEdit );
