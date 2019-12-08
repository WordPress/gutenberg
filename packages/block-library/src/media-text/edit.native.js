/**
 * External dependencies
 */
import { get } from 'lodash';
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	BlockVerticalAlignmentToolbar,
	InnerBlocks,
	withColors,
} from '@wordpress/block-editor';
import { Component } from '@wordpress/element';
import {
	ToolbarGroup,
} from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { withViewportMatch } from '@wordpress/viewport';

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
	[ 'core/paragraph' ],
];
// this limits the resize to a safe zone to avoid making broken layouts
const WIDTH_CONSTRAINT_PERCENTAGE = 15;
const applyWidthConstraints = ( width ) => Math.max( WIDTH_CONSTRAINT_PERCENTAGE, Math.min( width, 100 - WIDTH_CONSTRAINT_PERCENTAGE ) );

class MediaTextEdit extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectMedia = this.onSelectMedia.bind( this );
		this.onMediaUpdate = this.onMediaUpdate.bind( this );
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

		if ( mediaType === 'image' && media.sizes ) {
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

	onMediaUpdate( media ) {
		const { setAttributes } = this.props;

		setAttributes( {
			mediaId: media.id,
			mediaUrl: media.url,
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
		const { attributes, isSelected } = this.props;
		const { mediaAlt, mediaId, mediaPosition, mediaType, mediaUrl, mediaWidth, imageFill, focalPoint } = attributes;

		return (
			<MediaContainer
				onSelectMedia={ this.onSelectMedia }
				onMediaUpdate={ this.onMediaUpdate }
				onWidthChange={ this.onWidthChange }
				commitWidthChange={ this.commitWidthChange }
				onFocus={ this.props.onFocus }
				{ ...{ mediaAlt, mediaId, mediaType, mediaUrl, mediaPosition, mediaWidth, imageFill, focalPoint, isSelected } }
			/>
		);
	}

	render() {
		const {
			attributes,
			backgroundColor,
			setAttributes,
			isMobile,
			isSelected,
			isParentSelected,
			isAncestorSelected,
		} = this.props;
		const {
			isStackedOnMobile,
			mediaPosition,
			mediaWidth,
			verticalAlignment,
		} = attributes;
		const shouldStack = isStackedOnMobile && isMobile;
		const temporaryMediaWidth = shouldStack ? 100 : ( this.state.mediaWidth || mediaWidth );
		const widthString = `${ temporaryMediaWidth }%`;

		const innerBlockContainerStyle = ! shouldStack && {
			...styles.paddingHorizontalNone,
			...( mediaPosition === 'right' && styles.innerPaddingMediaOnRight ),
			...( mediaPosition === 'left' && styles.innerPaddingMediaOnLeft ),
		};
		const containerStyles = {
			...styles[ 'wp-block-media-text' ],
			...styles[ `is-vertically-aligned-${ verticalAlignment || 'center' }` ],
			...( mediaPosition === 'right' ? styles[ 'has-media-on-the-right' ] : {} ),
			...( shouldStack ? styles[ 'is-stacked-on-mobile' ] : {} ),
			...( shouldStack && mediaPosition === 'right' ? styles[ 'is-stacked-on-mobile.has-media-on-the-right' ] : {} ),
			backgroundColor: backgroundColor.color,
		};
		const innerBlockWidth = shouldStack ? 100 : ( 100 - temporaryMediaWidth );
		const innerBlockWidthString = `${ innerBlockWidth }%`;
		const mediaContainerStyle = {
			...( isParentSelected || isAncestorSelected ? styles.denseMediaPadding : styles.regularMediaPadding ),
			...( isSelected && styles.innerPadding ),
		};

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
					<ToolbarGroup
						controls={ toolbarControls }
					/>
					<BlockVerticalAlignmentToolbar
						onChange={ onVerticalAlignmentChange }
						value={ verticalAlignment }
						isCollapsed={ false }
					/>
				</BlockControls>
				<View style={ containerStyles }>
					<View style={ { width: widthString, ...mediaContainerStyle } } >
						{ this.renderMediaArea() }
					</View>
					<View style={ { width: innerBlockWidthString, ...innerBlockContainerStyle } }>
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

export default compose(
	withColors( 'backgroundColor' ),
	withViewportMatch( { isMobile: '< small' } ),
	withSelect( ( select, { clientId } ) => {
		const {
			getSelectedBlockClientId,
			getBlockRootClientId,
			getBlockParents,
		} = select( 'core/block-editor' );

		const parents = getBlockParents( clientId, true );

		const selectedBlockClientId = getSelectedBlockClientId();
		const isParentSelected = selectedBlockClientId && selectedBlockClientId === getBlockRootClientId( clientId );
		const isAncestorSelected = selectedBlockClientId && parents.includes( selectedBlockClientId );

		return {
			isSelected: selectedBlockClientId === clientId,
			isParentSelected,
			isAncestorSelected,
		};
	} ),
)( MediaTextEdit );
