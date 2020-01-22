/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Icon,
	ImageWithFocalPoint,
	PanelBody,
	RangeControl,
} from '@wordpress/components';
import {
	InnerBlocks,
	InspectorControls,
	MEDIA_TYPE_IMAGE,
	MediaPlaceholder,
	withColors,
} from '@wordpress/block-editor';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import icon from './icon';
import { onCoverSelectMedia } from './edit.js';
import { COVER_MIN_HEIGHT, IMAGE_BACKGROUND_TYPE, VIDEO_BACKGROUND_TYPE } from './shared';

/**
 * Constants
 */
const ALLOWED_MEDIA_TYPES = [ MEDIA_TYPE_IMAGE ];
const INNER_BLOCKS_TEMPLATE = [
	[ 'core/paragraph', {
		align: 'center',
		fontSize: 'large',
		placeholder: __( 'Write title…' ),
		textColor: 'very-light-gray',
	} ],
];
const COVER_MAX_HEIGHT = 1000;
const COVER_DEFAULT_HEIGHT = 300;

const Cover = ( {
	attributes,
	isAncestorSelected,
	isParentSelected,
	isSelected,
	onFocus,
	overlayColor,
	setAttributes,
} ) => {
	const {
		backgroundType,
		dimRatio,
		focalPoint,
		gradientValue,
		minHeight,
		url,
	} = attributes;
	const [ containerSize, setContainerSize ] = useState( null );
	const CONTAINER_HEIGHT = minHeight || COVER_DEFAULT_HEIGHT;

	const onSelectMedia = ( media ) => {
		const onSelect = onCoverSelectMedia( setAttributes );
		onSelect( media );
	};

	const onHeightChange = ( value ) => {
		if ( minHeight || value !== COVER_DEFAULT_HEIGHT ) {
			setAttributes( { minHeight: value } );
		}
	};

	const onOpactiyChange = ( value ) => {
		setAttributes( { dimRatio: value } );
	};

	const onContainerLayout = ( event ) => {
		const { height, width } = event.nativeEvent.layout;
		setContainerSize( { width, height } );
	};

	const getOpacity = () => {
		// Set opacity to 1 while video support is not available
		if ( VIDEO_BACKGROUND_TYPE === backgroundType ) {
			return 1;
		}

		if ( url ) {
			return dimRatio !== 0 ? dimRatio / 100 : 0;
		}

		return url ? 0.5 : 1;
	};

	const getOverlayStyles = () => {
		return [
			styles.overlay,
			{
				backgroundColor: overlayColor && overlayColor.color ? overlayColor.color : styles.overlay.color,
				opacity: getOpacity(),
			},
		];
	};

	const placeholderIcon = <Icon icon={ icon } { ...styles.icon } />;

	const controls = (
		<InspectorControls>
			<PanelBody title={ __( 'Dimensions' ) } >
				<RangeControl
					label={ __( 'Minimum height in pixels' ) }
					minimumValue={ COVER_MIN_HEIGHT }
					maximumValue={ COVER_MAX_HEIGHT }
					separatorType={ 'none' }
					value={ CONTAINER_HEIGHT }
					onChange={ onHeightChange }
					style={ styles.rangeCellContainer }
				/>
			</PanelBody>
			{ url ?
				<PanelBody title={ __( 'Overlay' ) } >
					<RangeControl
						label={ __( 'Background Opacity' ) }
						minimumValue={ 0 }
						maximumValue={ 100 }
						separatorType={ 'none' }
						value={ dimRatio }
						onChange={ onOpactiyChange }
						style={ styles.rangeCellContainer }
					/>
				</PanelBody> : null }
		</InspectorControls>
	);

	const hasBackground = !! ( url || overlayColor.color || gradientValue );

	const containerStyles = {
		...( isParentSelected || isAncestorSelected ? styles.denseMediaPadding : styles.regularMediaPadding ),
		...( isSelected && styles.innerPadding ),
	};

	if ( ! hasBackground ) {
		return <MediaPlaceholder
			icon={ placeholderIcon }
			labels={ {
				title: __( 'Cover' ),
			} }
			onSelect={ onSelectMedia }
			onlyMediaLibrary={ true }
			allowedTypes={ ALLOWED_MEDIA_TYPES }
			onFocus={ onFocus }
		/>;
	}

	return (
		<View style={ containerStyles }>
			{ controls }
			<View
				onLayout={ onContainerLayout }
				style={ [ styles.backgroundContainer, { minHeight: CONTAINER_HEIGHT } ] }>
				<View style={ [ styles.content, { minHeight: CONTAINER_HEIGHT } ] } >
					<InnerBlocks
						template={ INNER_BLOCKS_TEMPLATE }
					/>
				</View>

				<View style={ getOverlayStyles() } />

				{ IMAGE_BACKGROUND_TYPE === backgroundType && (
					<ImageWithFocalPoint
						containerSize={ containerSize }
						contentHeight={ CONTAINER_HEIGHT }
						focalPoint={ focalPoint }
						url={ url }
					/>
				) }
			</View>
		</View>
	);
};

export default compose( [
	withColors( { overlayColor: 'background-color' } ),
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
	withPreferredColorScheme,
] )( Cover );

