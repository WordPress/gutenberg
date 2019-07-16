/**
 * External dependencies
 */
import { get } from 'lodash';
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	BlockControls,
	BlockVerticalAlignmentToolbar,
	InnerBlocks,
	withColors,
} from '@wordpress/block-editor';
import { Component } from '@wordpress/element';
import {
	Toolbar,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import MediaContainer from './media-container';
import styles from './style.scss';

/**
 * Constants
 */
const ALLOWED_BLOCKS = [ 'core/button', 'core/paragraph', 'core/heading', 'core/list' ];
const TEMPLATE = [
	[ 'core/paragraph', { fontSize: 'large', placeholder: _x( 'Content…', 'content placeholder' ) } ],
];
// this limits the resize to a safe zone to avoid making broken layouts
const WIDTH_CONSTRAINT_PERCENTAGE = 15;
const applyWidthConstraints = ( width ) => Math.max( WIDTH_CONSTRAINT_PERCENTAGE, Math.min( width, 100 - WIDTH_CONSTRAINT_PERCENTAGE ) );

class MediaTextEdit extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectMedia = this.onSelectMedia.bind( this );
		this.onWidthChange = this.onWidthChange.bind( this );
		this.commitWidthChange = this.commitWidthChange.bind( this );
		this.state = {
			mediaWidth: null,
		};
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
				onSelectMedia={ this.onSelectMedia }
				onWidthChange={ this.onWidthChange }
				commitWidthChange={ this.commitWidthChange }
				onFocus={ this.props.onFocus }
				{ ...{ mediaAlt, mediaId, mediaType, mediaUrl, mediaPosition, mediaWidth, imageFill, focalPoint } }
			/>
		);
	}

	render() {
		const {
			attributes,
			backgroundColor,
			setAttributes,
		} = this.props;
		const {
			isStackedOnMobile,
			mediaPosition,
			mediaWidth,
			verticalAlignment,
		} = attributes;
		const temporaryMediaWidth = this.state.mediaWidth || mediaWidth;
		const widthString = `${ temporaryMediaWidth }%`;
		const containerStyles = {
			...styles[ 'wp-block-media-text' ],
			...styles[ `is-vertically-aligned-${ verticalAlignment }` ],
			...( isStackedOnMobile ? styles[ 'is-stacked-on-mobile' ] : {} ),
			...( mediaPosition === 'right' ? styles[ 'has-media-on-the-right' ] : {} ),
			backgroundColor: backgroundColor.color,
		};
		const innerBlockWidth = 100 - temporaryMediaWidth;
		const innerBlockWidthString = `${ innerBlockWidth }%`;

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

		const onVerticalAlignmentChange = ( alignment ) => {
			setAttributes( { verticalAlignment: alignment } );
		};

		return (
			<>
				<BlockControls>
					<Toolbar
						controls={ toolbarControls }
					/>
					<BlockVerticalAlignmentToolbar
						onChange={ onVerticalAlignmentChange }
						value={ verticalAlignment }
					/>
				</BlockControls>
				<View style={ containerStyles }>
					<View style={ { width: widthString } }>
						{ this.renderMediaArea() }
					</View>
					<View style={ { width: innerBlockWidthString } }>
						<InnerBlocks
							allowedBlocks={ ALLOWED_BLOCKS }
							template={ TEMPLATE }
							templateInsertUpdatesSelection={ false }
						/>
					</View>
				</View>
			</>
		);
	}
}

export default withColors( 'backgroundColor' )( MediaTextEdit );
