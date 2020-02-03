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
import { useEffect } from '@wordpress/element';
import { cover as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import { attributesFromMedia } from './utils';
import {
	COVER_MIN_HEIGHT,
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
} from './shared';

/**
 * Constants
 */
const ALLOWED_MEDIA_TYPES = [ MEDIA_TYPE_IMAGE ];
const INNER_BLOCKS_TEMPLATE = [
	[
		'core/paragraph',
		{
			align: 'center',
			placeholder: __( 'Write title…' ),
		},
	],
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
	const CONTAINER_HEIGHT = minHeight || COVER_DEFAULT_HEIGHT;

	// Used to set a default color for its InnerBlocks
	// since there's no system to inherit styles yet
	// the RichText component will check if there are
	// parent styles for the current block. If there are,
	// it will use that color instead.
	useEffect( () => {
		setAttributes( { childrenStyles: styles.defaultColor } );
	}, [ setAttributes ] );

	const onSelectMedia = ( media ) => {
		const onSelect = attributesFromMedia( setAttributes );
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

	const getOpacity = () => {
		// Set opacity to 1 while video support is not available
		if ( VIDEO_BACKGROUND_TYPE === backgroundType ) {
			return 1;
		}

		return url ? dimRatio / 100 : 1;
	};

	const getOverlayStyles = () => {
		return [
			styles.overlay,
			{
				backgroundColor:
					overlayColor && overlayColor.color
						? overlayColor.color
						: styles.overlay.color,
				opacity: getOpacity(),
			},
		];
	};

	const placeholderIcon = <Icon icon={ icon } { ...styles.icon } />;

	const controls = (
		<InspectorControls>
			<PanelBody title={ __( 'Dimensions' ) }>
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
			{ url ? (
				<PanelBody title={ __( 'Overlay' ) }>
					<RangeControl
						label={ __( 'Background Opacity' ) }
						minimumValue={ 0 }
						maximumValue={ 100 }
						separatorType={ 'none' }
						value={ dimRatio }
						onChange={ onOpactiyChange }
						style={ styles.rangeCellContainer }
					/>
				</PanelBody>
			) : null }
		</InspectorControls>
	);

	const hasBackground = !! ( url || overlayColor.color || gradientValue );

	const containerStyles = {
		...( isParentSelected || isAncestorSelected
			? styles.denseMediaPadding
			: styles.regularMediaPadding ),
		...( isSelected && styles.innerPadding ),
	};

	if ( ! hasBackground ) {
		return (
			<MediaPlaceholder
				icon={ placeholderIcon }
				labels={ {
					title: __( 'Cover' ),
				} }
				onSelect={ onSelectMedia }
				onlyMediaLibrary={ true }
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				onFocus={ onFocus }
			/>
		);
	}

	return (
		<View style={ containerStyles }>
			{ controls }
			<View style={ [ styles.backgroundContainer ] }>
				<View
					style={ [
						styles.content,
						{ minHeight: CONTAINER_HEIGHT },
					] }
				>
					<InnerBlocks template={ INNER_BLOCKS_TEMPLATE } />
				</View>

				<View style={ getOverlayStyles() } />

				{ IMAGE_BACKGROUND_TYPE === backgroundType && (
					<ImageWithFocalPoint
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
		const isParentSelected =
			selectedBlockClientId &&
			selectedBlockClientId === getBlockRootClientId( clientId );
		const isAncestorSelected =
			selectedBlockClientId && parents.includes( selectedBlockClientId );

		return {
			isSelected: selectedBlockClientId === clientId,
			isParentSelected,
			isAncestorSelected,
		};
	} ),
	withPreferredColorScheme,
] )( Cover );
