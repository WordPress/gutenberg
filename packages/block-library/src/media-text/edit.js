/**
 * External dependencies
 */
import classnames from 'classnames';
import { get, find, isEmpty, each } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	BlockControls,
	BlockVerticalAlignmentToolbar,
	InnerBlocks,
	InspectorControls,
	PanelColorSettings,
	withColors,
	__experimentalImageURLInputUI as ImageURLInputUI,
	stopPropagation,
	stopPropagationRelevantKeys,
} from '@wordpress/block-editor';
import { Component } from '@wordpress/element';
import {
	PanelBody,
	TextareaControl,
	ToggleControl,
	ToolbarGroup,
	Toolbar,
	ExternalLink,
	FocalPointPicker,
	TextControl,
	SVG,
	Path,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import MediaContainer from './media-container';

/**
 * Constants
 */
const TEMPLATE = [
	[ 'core/paragraph', { fontSize: 'large', placeholder: _x( 'Content…', 'content placeholder' ) } ],
];
// this limits the resize to a safe zone to avoid making broken layouts
const WIDTH_CONSTRAINT_PERCENTAGE = 15;
const applyWidthConstraints = ( width ) => Math.max( WIDTH_CONSTRAINT_PERCENTAGE, Math.min( width, 100 - WIDTH_CONSTRAINT_PERCENTAGE ) );

export const LINK_DESTINATION_NONE = 'none';
export const LINK_DESTINATION_CUSTOM = 'custom';
export const LINK_DESTINATION_MEDIA = 'media';
export const LINK_DESTINATION_ATTACHMENT = 'attachment';
export const NEW_TAB_REL = [ 'noreferrer', 'noopener' ];

const icon = <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path d="M0,0h24v24H0V0z" fill="none" /><Path d="m19 5v14h-14v-14h14m0-2h-14c-1.1 0-2 0.9-2 2v14c0 1.1 0.9 2 2 2h14c1.1 0 2-0.9 2-2v-14c0-1.1-0.9-2-2-2z" /><Path d="m14.14 11.86l-3 3.87-2.14-2.59-3 3.86h12l-3.86-5.14z" /></SVG>;

const removeNewTabRel = ( currentRel ) => {
	let newRel = currentRel;

	if ( currentRel !== undefined && ! isEmpty( newRel ) ) {
		if ( ! isEmpty( newRel ) ) {
			each( NEW_TAB_REL, function( relVal ) {
				const regExp = new RegExp( '\\b' + relVal + '\\b', 'gi' );
				newRel = newRel.replace( regExp, '' );
			} );

			// Only trim if NEW_TAB_REL values was replaced.
			if ( newRel !== currentRel ) {
				newRel = newRel.trim();
			}

			if ( isEmpty( newRel ) ) {
				newRel = undefined;
			}
		}
	}

	return newRel;
};

const getUpdatedLinkTargetSettings = ( value, { rel } ) => {
	const linkTarget = value ? '_blank' : undefined;

	let updatedRel;
	if ( ! linkTarget && ! rel ) {
		updatedRel = undefined;
	} else {
		updatedRel = removeNewTabRel( rel );
	}

	return {
		linkTarget,
		rel: updatedRel,
	};
};

class MediaTextEdit extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectMedia = this.onSelectMedia.bind( this );
		this.onWidthChange = this.onWidthChange.bind( this );
		this.commitWidthChange = this.commitWidthChange.bind( this );
		this.state = {
			mediaWidth: null,
		};
		this.getLinkDestinations = this.getLinkDestinations.bind( this );
		this.onSetHref = this.onSetHref.bind( this );
		this.onSetNewTab = this.onSetNewTab.bind( this );
		this.onSetLinkRel = this.onSetLinkRel.bind( this );
		this.onSetLinkClass = this.onSetLinkClass.bind( this );
	}

	getLinkDestinations() {
		const { mediaType, mediaUrl, mediaLink } = this.props.attributes;
		return [
			{
				linkDestination: LINK_DESTINATION_MEDIA,
				title: __( 'Media File' ),
				url: ( mediaType === 'image' && mediaUrl ) || undefined,
				icon,
			},
			{
				linkDestination: LINK_DESTINATION_ATTACHMENT,
				title: __( 'Attachment Page' ),
				url: ( mediaType === 'image' && mediaLink ) || undefined,
				icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path d="M0 0h24v24H0V0z" fill="none" /><Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" /></SVG>,
			},
		];
	}

	onSetHref( value ) {
		const linkDestinations = this.getLinkDestinations();
		const { attributes } = this.props;
		const { linkDestination } = attributes;
		let linkDestinationInput;
		if ( ! value ) {
			linkDestinationInput = LINK_DESTINATION_NONE;
		} else {
			linkDestinationInput = (
				find( linkDestinations, ( destination ) => {
					return destination.url === value;
				} ) ||
				{ linkDestination: LINK_DESTINATION_CUSTOM }
			).linkDestination;
		}
		if ( linkDestination !== linkDestinationInput ) {
			this.props.setAttributes( {
				linkDestination: linkDestinationInput,
				href: value,
			} );
			return;
		}
		this.props.setAttributes( { href: value } );
	}

	onSetNewTab( value ) {
		const updatedLinkTarget = getUpdatedLinkTargetSettings( value, this.props.attributes );
		this.props.setAttributes( updatedLinkTarget );
	}

	onSetLinkRel( value ) {
		this.props.setAttributes( { rel: value } );
	}

	onSetLinkClass( value ) {
		this.props.setAttributes( { linkClass: value } );
	}

	onSelectMedia( media ) {
		const { setAttributes } = this.props;

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
		} else { // for media selections originated from existing files in the media library.
			mediaType = media.type;
		}

		if ( mediaType === 'image' ) {
			// Try the "large" size URL, falling back to the "full" size URL below.
			src = get( media, [ 'sizes', 'large', 'url' ] ) || get( media, [ 'media_details', 'sizes', 'large', 'source_url' ] );
		}
		setAttributes( {
			mediaAlt: media.alt,
			mediaId: media.id,
			mediaType,
			mediaUrl: src || media.url,
			mediaLink: media.link || undefined,
			imageFill: undefined,
			focalPoint: undefined,
		} );
	}

	onWidthChange( width ) {
		this.setState( {
			mediaWidth: applyWidthConstraints( width ),
		} );
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
		const { mediaAlt, mediaId, mediaPosition, mediaType, mediaUrl, mediaWidth, imageFill, focalPoint } = attributes;

		return (
			<MediaContainer
				className="block-library-media-text__media-container"
				onSelectMedia={ this.onSelectMedia }
				onWidthChange={ this.onWidthChange }
				commitWidthChange={ this.commitWidthChange }
				{ ...{ mediaAlt, mediaId, mediaType, mediaUrl, mediaPosition, mediaWidth, imageFill, focalPoint } }
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

		const cleanRel = removeNewTabRel( rel );

		const temporaryMediaWidth = this.state.mediaWidth;
		const classNames = classnames( className, {
			'has-media-on-the-right': 'right' === mediaPosition,
			'is-selected': isSelected,
			'has-background': ( backgroundColor.class || backgroundColor.color ),
			[ backgroundColor.class ]: backgroundColor.class,
			'is-stacked-on-mobile': isStackedOnMobile,
			[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
			'is-image-fill': imageFill,
		} );
		const widthString = `${ temporaryMediaWidth || mediaWidth }%`;
		const gridTemplateColumns = 'right' === mediaPosition ? `1fr ${ widthString }` : `${ widthString } 1fr`;
		const style = {
			gridTemplateColumns,
			msGridColumns: gridTemplateColumns,
			backgroundColor: backgroundColor.color,
		};
		const colorSettings = [ {
			value: backgroundColor.color,
			onChange: setBackgroundColor,
			label: __( 'Background Color' ),
		} ];
		const toolbarControls = [ {
			icon: 'align-pull-left',
			title: __( 'Show media on left' ),
			isActive: mediaPosition === 'left',
			onClick: () => setAttributes( { mediaPosition: 'left' } ),
		}, {
			icon: 'align-pull-right',
			title: __( 'Show media on right' ),
			isActive: mediaPosition === 'right',
			onClick: () => setAttributes( { mediaPosition: 'right' } ),
		} ];
		const onMediaAltChange = ( newMediaAlt ) => {
			setAttributes( { mediaAlt: newMediaAlt } );
		};
		const onVerticalAlignmentChange = ( alignment ) => {
			setAttributes( { verticalAlignment: alignment } );
		};
		const mediaTextGeneralSettings = (
			<PanelBody title={ __( 'Media & Text Settings' ) }>
				<ToggleControl
					label={ __( 'Stack on mobile' ) }
					checked={ isStackedOnMobile }
					onChange={ () => setAttributes( {
						isStackedOnMobile: ! isStackedOnMobile,
					} ) }
				/>
				{ mediaType === 'image' && ( <ToggleControl
					label={ __( 'Crop image to fill entire column' ) }
					checked={ imageFill }
					onChange={ () => setAttributes( {
						imageFill: ! imageFill,
					} ) }
				/> ) }
				{ imageFill && ( <FocalPointPicker
					label={ __( 'Focal Point Picker' ) }
					url={ mediaUrl }
					value={ focalPoint }
					onChange={ ( value ) => setAttributes( { focalPoint: value } ) }
				/> ) }
				{ mediaType === 'image' && ( <TextareaControl
					label={ __( 'Alt Text (Alternative Text)' ) }
					value={ mediaAlt }
					onChange={ onMediaAltChange }
					help={
						<>
							<ExternalLink href="https://www.w3.org/WAI/tutorials/images/decision-tree">
								{ __( 'Describe the purpose of the image' ) }
							</ExternalLink>
							{ __( 'Leave empty if the image is purely decorative.' ) }
						</>
					}
				/> ) }
			</PanelBody>
		);
		return (
			<>
				<InspectorControls>
					{ mediaTextGeneralSettings }
					<PanelColorSettings
						title={ __( 'Color Settings' ) }
						initialOpen={ false }
						colorSettings={ colorSettings }
					/>
				</InspectorControls>
				<BlockControls>
					<ToolbarGroup
						controls={ toolbarControls }
					/>
					<BlockVerticalAlignmentToolbar
						onChange={ onVerticalAlignmentChange }
						value={ verticalAlignment }
					/>
					{ mediaType === 'image' && ( <Toolbar>
						<ImageURLInputUI
							url={ href || '' }
							onChangeUrl={ this.onSetHref }
							mediaLinks={ this.getLinkDestinations() }
							linkDestination={ linkDestination }
							advancedOptions={
								<>
									<ToggleControl
										label={ __( 'Open in New Tab' ) }
										onChange={ this.onSetNewTab }
										checked={ linkTarget === '_blank' } />
									<TextControl
										label={ __( 'Link Rel' ) }
										value={ cleanRel || '' }
										onChange={ this.onSetLinkRel }
										onKeyPress={ stopPropagation }
										onKeyDown={ stopPropagationRelevantKeys }
									/>
									<TextControl
										label={ __( 'Link CSS Class' ) }
										value={ linkClass || '' }
										onKeyPress={ stopPropagation }
										onKeyDown={ stopPropagationRelevantKeys }
										onChange={ this.onSetLinkClass }
									/>
								</>
							}
						/>
					</Toolbar> ) }
				</BlockControls>
				<div className={ classNames } style={ style } >
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

export default withColors( 'backgroundColor' )( MediaTextEdit );
