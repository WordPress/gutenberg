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
	MEDIA_TYPE_VIDEO,
} from '@wordpress/block-editor';
import { Component } from '@wordpress/element';
import { Button, ToolbarGroup } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { pullLeft, pullRight, replace } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MediaContainer from './media-container';
import styles from './style.scss';

/**
 * Constants
 */
const ALLOWED_BLOCKS = [
	'core/button',
	'core/paragraph',
	'core/heading',
	'core/list',
];
const TEMPLATE = [ [ 'core/paragraph' ] ];
// this limits the resize to a safe zone to avoid making broken layouts
const WIDTH_CONSTRAINT_PERCENTAGE = 15;
const BREAKPOINTS = {
	mobile: 480,
};
const applyWidthConstraints = ( width ) =>
	Math.max(
		WIDTH_CONSTRAINT_PERCENTAGE,
		Math.min( width, 100 - WIDTH_CONSTRAINT_PERCENTAGE )
	);

class MediaTextEdit extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectMedia = this.onSelectMedia.bind( this );
		this.onMediaUpdate = this.onMediaUpdate.bind( this );
		this.onWidthChange = this.onWidthChange.bind( this );
		this.commitWidthChange = this.commitWidthChange.bind( this );
		this.onLayoutChange = this.onLayoutChange.bind( this );
		this.onMediaSelected = this.onMediaSelected.bind( this );
		this.onReplaceMedia = this.onReplaceMedia.bind( this );
		this.onSetOpenPickerRef = this.onSetOpenPickerRef.bind( this );

		this.state = {
			mediaWidth: null,
			containerWidth: 0,
			isMediaSelected: false,
		};
	}

	static getDerivedStateFromProps( props, state ) {
		return {
			isMediaSelected:
				state.isMediaSelected &&
				props.isSelected &&
				! props.isAncestorSelected,
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
		} else {
			// for media selections originated from existing files in the media library.
			mediaType = media.type;
		}

		if ( mediaType === 'image' && media.sizes ) {
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

	onLayoutChange( { nativeEvent } ) {
		const { width } = nativeEvent.layout;
		const { containerWidth } = this.state;

		if ( containerWidth === width ) {
			return null;
		}

		this.setState( {
			containerWidth: width,
		} );
	}

	onMediaSelected() {
		this.setState( { isMediaSelected: true } );
	}

	onReplaceMedia() {
		if ( this.openPickerRef ) {
			this.openPickerRef();
		}
	}

	onSetOpenPickerRef( openPicker ) {
		this.openPickerRef = openPicker;
	}

	renderMediaArea() {
		const { isMediaSelected } = this.state;
		const { attributes, isSelected } = this.props;
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
				commitWidthChange={ this.commitWidthChange }
				isMediaSelected={ isMediaSelected }
				onFocus={ this.props.onFocus }
				onMediaSelected={ this.onMediaSelected }
				onMediaUpdate={ this.onMediaUpdate }
				onSelectMedia={ this.onSelectMedia }
				onSetOpenPickerRef={ this.onSetOpenPickerRef }
				onWidthChange={ this.onWidthChange }
				{ ...{
					mediaAlt,
					mediaId,
					mediaType,
					mediaUrl,
					mediaPosition,
					mediaWidth,
					imageFill,
					focalPoint,
					isSelected,
				} }
			/>
		);
	}

	render() {
		const {
			attributes,
			backgroundColor,
			setAttributes,
			isSelected,
			isRTL,
			wrapperProps,
		} = this.props;
		const {
			isStackedOnMobile,
			mediaPosition,
			mediaWidth,
			mediaType,
			verticalAlignment,
		} = attributes;
		const { containerWidth, isMediaSelected } = this.state;

		const isMobile = containerWidth < BREAKPOINTS.mobile;
		const shouldStack = isStackedOnMobile && isMobile;
		const temporaryMediaWidth = shouldStack
			? 100
			: this.state.mediaWidth || mediaWidth;
		const widthString = `${ temporaryMediaWidth }%`;

		const innerBlockContainerStyle = ! shouldStack
			? styles.innerBlock
			: {
					...( mediaPosition === 'left'
						? styles.innerBlockStackMediaLeft
						: styles.innerBlockStackMediaRight ),
			  };

		const containerStyles = {
			...styles[ 'wp-block-media-text' ],
			...styles[
				`is-vertically-aligned-${ verticalAlignment || 'center' }`
			],
			...( mediaPosition === 'right'
				? styles[ 'has-media-on-the-right' ]
				: {} ),
			...( shouldStack && styles[ 'is-stacked-on-mobile' ] ),
			...( shouldStack && mediaPosition === 'right'
				? styles[ 'is-stacked-on-mobile.has-media-on-the-right' ]
				: {} ),
			...( isSelected && styles[ 'is-selected' ] ),
			backgroundColor:
				wrapperProps?.style?.backgroundColor || backgroundColor.color,
		};

		const innerBlockWidth = shouldStack ? 100 : 100 - temporaryMediaWidth;
		const innerBlockWidthString = `${ innerBlockWidth }%`;

		const mediaContainerStyle = shouldStack
			? {
					...( mediaPosition === 'left' && styles.mediaStackLeft ),
					...( mediaPosition === 'right' && styles.mediaStackRight ),
			  }
			: {
					...( mediaPosition === 'left' && styles.mediaLeft ),
					...( mediaPosition === 'right' && styles.mediaRight ),
			  };

		const toolbarControls = [
			{
				icon: isRTL ? pullRight : pullLeft,
				title: __( 'Show media on left' ),
				isActive: mediaPosition === 'left',
				onClick: () => setAttributes( { mediaPosition: 'left' } ),
			},
			{
				icon: isRTL ? pullLeft : pullRight,
				title: __( 'Show media on right' ),
				isActive: mediaPosition === 'right',
				onClick: () => setAttributes( { mediaPosition: 'right' } ),
			},
		];

		const onVerticalAlignmentChange = ( alignment ) => {
			setAttributes( { verticalAlignment: alignment } );
		};

		return (
			<>
				<BlockControls>
					{ ( isMediaSelected || mediaType === MEDIA_TYPE_VIDEO ) && (
						<ToolbarGroup>
							<Button
								label={ __( 'Edit media' ) }
								icon={ replace }
								onClick={ this.onReplaceMedia }
							/>
						</ToolbarGroup>
					) }
					{ ( ! isMediaSelected ||
						mediaType === MEDIA_TYPE_VIDEO ) && (
						<>
							<ToolbarGroup controls={ toolbarControls } />
							<BlockVerticalAlignmentToolbar
								onChange={ onVerticalAlignmentChange }
								value={ verticalAlignment }
							/>
						</>
					) }
				</BlockControls>
				<View
					style={ containerStyles }
					onLayout={ this.onLayoutChange }
				>
					<View
						style={ { width: widthString, ...mediaContainerStyle } }
					>
						{ this.renderMediaArea() }
					</View>
					<View
						style={ {
							width: innerBlockWidthString,
							...innerBlockContainerStyle,
						} }
					>
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
	withSelect( ( select, { clientId } ) => {
		const {
			getSelectedBlockClientId,
			getBlockRootClientId,
			getBlockParents,
			getSettings,
		} = select( 'core/block-editor' );

		const parents = getBlockParents( clientId, true );

		const selectedBlockClientId = getSelectedBlockClientId();
		const isParentSelected =
			selectedBlockClientId &&
			selectedBlockClientId === getBlockRootClientId( clientId );
		const isAncestorSelected =
			selectedBlockClientId && parents.includes( selectedBlockClientId );

		return {
			isSelected: selectedBlockClientId === clientId,
			isParentSelected,
			isAncestorSelected,
			isRTL: getSettings().isRTL,
		};
	} )
)( MediaTextEdit );
