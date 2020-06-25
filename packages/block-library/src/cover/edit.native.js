/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback } from 'react-native';
import Video from 'react-native-video';

/**
 * WordPress dependencies
 */
import {
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
	mediaUploadSync,
} from '@wordpress/react-native-bridge';
import { __ } from '@wordpress/i18n';
import {
	Icon,
	ImageWithFocalPoint,
	PanelBody,
	RangeControl,
	ToolbarButton,
	ToolbarGroup,
	Gradient,
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
import { useEffect, useState } from '@wordpress/element';
import { cover as icon, replace } from '@wordpress/icons';
import { getProtocol } from '@wordpress/url';

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
import OverlayColorSettings from './overlay-color-settings';

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
		customOverlayColor,
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

	// sync with local media store
	useEffect( mediaUploadSync, [] );

	// initialize uploading flag to false, awaiting sync
	const [ isUploadInProgress, setIsUploadInProgress ] = useState( false );

	// initialize upload failure flag to true if url is local
	const [ didUploadFail, setDidUploadFail ] = useState(
		id && getProtocol( url ) === 'file:'
	);

	// don't show failure if upload is in progress
	const shouldShowFailure = didUploadFail && ! isUploadInProgress;

	const onSelectMedia = ( media ) => {
		setDidUploadFail( false );
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

	const onMediaPressed = () => {
		if ( isUploadInProgress ) {
			requestImageUploadCancelDialog( id );
		} else if ( shouldShowFailure ) {
			requestImageFailedRetryDialog( id );
		}
	};

	const [ isVideoLoading, setIsVideoLoading ] = useState( true );

	const onVideoLoadStart = () => {
		setIsVideoLoading( true );
	};

	const onVideoLoad = () => {
		setIsVideoLoading( false );
	};

	const backgroundColor = getStylesFromColorScheme(
		styles.backgroundSolid,
		styles.backgroundSolidDark
	);

	const overlayStyles = [
		styles.overlay,
		url && { opacity: dimRatio / 100 },
		! gradientValue && {
			backgroundColor:
				customOverlayColor ||
				overlayColor?.color ||
				style?.color?.background ||
				styles.overlay.color,
		},
		// While we don't support theme colors we add a default bg color
		! overlayColor.color && ! url ? backgroundColor : {},
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
			<OverlayColorSettings
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
			{ url ? (
				<PanelBody>
					<RangeControl
						label={ __( 'Opacity' ) }
						minimumValue={ 0 }
						maximumValue={ 100 }
						value={ dimRatio }
						onChange={ onOpactiyChange }
						style={ styles.rangeCellContainer }
						separatorType={ 'topFullWidth' }
					/>
				</PanelBody>
			) : null }
			<PanelBody title={ __( 'Dimensions' ) }>
				<RangeControl
					label={ __( 'Minimum height in pixels' ) }
					minimumValue={ COVER_MIN_HEIGHT }
					maximumValue={ COVER_MAX_HEIGHT }
					value={ CONTAINER_HEIGHT }
					onChange={ onHeightChange }
					style={ styles.rangeCellContainer }
				/>
			</PanelBody>
		</InspectorControls>
	);

	const renderBackground = ( {
		open: openMediaOptions,
		getMediaOptions,
	} ) => (
		<TouchableWithoutFeedback
			accessible={ ! isParentSelected }
			onPress={ onMediaPressed }
			onLongPress={ openMediaOptions }
			disabled={ ! isParentSelected }
		>
			<View style={ [ styles.background, backgroundColor ] }>
				{ getMediaOptions() }
				{ isParentSelected && toolbarControls( openMediaOptions ) }
				<MediaUploadProgress
					mediaId={ id }
					onUpdateMediaProgress={ () => {
						setIsUploadInProgress( true );
					} }
					onFinishMediaUploadWithSuccess={ ( {
						mediaServerId,
						mediaUrl,
					} ) => {
						setIsUploadInProgress( false );
						setDidUploadFail( false );
						setAttributes( {
							id: mediaServerId,
							url: mediaUrl,
							backgroundType,
						} );
					} }
					onFinishMediaUploadWithFailure={ () => {
						setIsUploadInProgress( false );
						setDidUploadFail( true );
					} }
					onMediaUploadStateReset={ () => {
						setIsUploadInProgress( false );
						setDidUploadFail( false );
						setAttributes( { id: undefined, url: undefined } );
					} }
				/>
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
						onLoad={ onVideoLoad }
						onLoadStart={ onVideoLoadStart }
						style={ [
							styles.background,
							// Hide Video component since it has black background while loading the source
							{ opacity: isVideoLoading ? 0 : 1 },
						] }
					/>
				) }
			</View>
		</TouchableWithoutFeedback>
	);

	if ( ! hasBackground ) {
		return (
			<View>
				<MediaPlaceholder
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
					<Gradient
						gradientValue={ gradientValue }
						style={ styles.background }
					/>
				) }
			</View>

			<MediaUpload
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				onSelect={ onSelectMedia }
				render={ renderBackground }
			/>

			{ shouldShowFailure && (
				<View
					pointerEvents="none"
					style={ styles.uploadFailedContainer }
				>
					<View style={ styles.uploadFailed }>
						<Icon
							icon={ 'warning' }
							{ ...styles.uploadFailedIcon }
						/>
					</View>
				</View>
			) }
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
