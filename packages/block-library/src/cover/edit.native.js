/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback } from 'react-native';
import Video from 'react-native-video';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Icon,
	ImageWithFocalPoint,
	PanelBody,
	RangeControl,
	ToolbarButton,
	ToolbarGroup,
	LinearGradient,
} from '@wordpress/components';
import {
	BlockControls,
	InnerBlocks,
	InspectorControls,
	MEDIA_TYPE_IMAGE,
	MEDIA_TYPE_VIDEO,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadProgress,
	withColors,
	__experimentalUseGradient,
} from '@wordpress/block-editor';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { cover as icon, replace } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import {
	attributesFromMedia,
	COVER_MIN_HEIGHT,
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
} from './shared';

/**
 * Constants
 */
const ALLOWED_MEDIA_TYPES = [ MEDIA_TYPE_IMAGE, MEDIA_TYPE_VIDEO ];
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
	getStylesFromColorScheme,
	isParentSelected,
	onFocus,
	overlayColor,
	setAttributes,
} ) => {
	const {
		backgroundType,
		dimRatio,
		focalPoint,
		minHeight,
		url,
		id,
		style,
	} = attributes;
	const CONTAINER_HEIGHT = minHeight || COVER_DEFAULT_HEIGHT;

	const { gradientValue } = __experimentalUseGradient();

	const hasBackground = !! (
		url ||
		( style && style.color && style.color.background ) ||
		attributes.overlayColor ||
		overlayColor.color ||
		gradientValue
	);

	// Used to set a default color for its InnerBlocks
	// since there's no system to inherit styles yet
	// the RichText component will check if there are
	// parent styles for the current block. If there are,
	// it will use that color instead.
	useEffect( () => {
		// While we don't support theme colors
		if ( ! attributes.overlayColor || ( ! attributes.overlay && url ) ) {
			setAttributes( { childrenStyles: styles.defaultColor } );
		}
	}, [ setAttributes ] );

	const onSelectMedia = ( media ) => {
		const onSelect = attributesFromMedia( setAttributes );
		// Remove gradient attribute
		setAttributes( { gradient: undefined, customGradient: undefined } );
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

	const overlayStyles = [
		styles.overlay,
		url && { opacity: dimRatio / 100 },
		! gradientValue && {
			backgroundColor:
				overlayColor?.color ||
				style?.color?.background ||
				styles.overlay.color,
		},
		// While we don't support theme colors we add a default bg color
		! overlayColor.color && ! url
			? getStylesFromColorScheme(
					styles.backgroundSolid,
					styles.backgroundSolidDark
			  )
			: {},
	];

	const placeholderIconStyle = getStylesFromColorScheme(
		styles.icon,
		styles.iconDark
	);

	const placeholderIcon = <Icon icon={ icon } { ...placeholderIconStyle } />;

	const toolbarControls = ( open ) => (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					title={ __( 'Edit cover media' ) }
					icon={ replace }
					onClick={ open }
				/>
			</ToolbarGroup>
		</BlockControls>
	);

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

	const renderBackground = ( {
		open: openMediaOptions,
		getMediaOptions,
	} ) => (
		<TouchableWithoutFeedback
			accessible={ ! isParentSelected }
			onLongPress={ openMediaOptions }
			disabled={ ! isParentSelected }
		>
			<View style={ styles.background }>
				{ getMediaOptions() }
				{ isParentSelected && toolbarControls( openMediaOptions ) }
				<MediaUploadProgress
					mediaId={ id }
					onFinishMediaUploadWithSuccess={ ( {
						mediaServerId,
						mediaUrl,
					} ) => {
						setAttributes( {
							id: mediaServerId,
							url: mediaUrl,
							backgroundType,
						} );
					} }
					renderContent={ () => (
						<>
							{ IMAGE_BACKGROUND_TYPE === backgroundType && (
								<ImageWithFocalPoint
									focalPoint={ focalPoint }
									url={ url }
								/>
							) }
							{ VIDEO_BACKGROUND_TYPE === backgroundType && (
								<Video
									muted
									disableFocus
									repeat
									resizeMode={ 'cover' }
									source={ { uri: url } }
									style={ styles.background }
								/>
							) }
						</>
					) }
				/>
			</View>
		</TouchableWithoutFeedback>
	);

	if ( ! hasBackground ) {
		return (
			<View>
				<MediaPlaceholder
					// eslint-disable-next-line no-undef
					__experimentalOnlyMediaLibrary={ ! __DEV__ }
					icon={ placeholderIcon }
					labels={ {
						title: __( 'Cover' ),
					} }
					onSelect={ onSelectMedia }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					onFocus={ onFocus }
				/>
			</View>
		);
	}

	return (
		<View style={ styles.backgroundContainer }>
			{ controls }

			<View
				pointerEvents="box-none"
				style={ [ styles.content, { minHeight: CONTAINER_HEIGHT } ] }
			>
				<InnerBlocks template={ INNER_BLOCKS_TEMPLATE } />
			</View>

			<View pointerEvents="none" style={ overlayStyles }>
				{ gradientValue && (
					<LinearGradient
						gradientValue={ gradientValue }
						style={ styles.background }
					/>
				) }
			</View>

			<MediaUpload
				// eslint-disable-next-line no-undef
				__experimentalOnlyMediaLibrary={ ! __DEV__ }
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				onSelect={ onSelectMedia }
				render={ renderBackground }
			/>
		</View>
	);
};

export default compose( [
	withColors( { overlayColor: 'background-color' } ),
	withSelect( ( select, { clientId } ) => {
		const { getSelectedBlockClientId } = select( 'core/block-editor' );

		const selectedBlockClientId = getSelectedBlockClientId();

		return {
			isParentSelected: selectedBlockClientId === clientId,
		};
	} ),
	withPreferredColorScheme,
] )( Cover );
