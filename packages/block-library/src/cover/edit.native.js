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
	requestImageFullscreenPreview,
	mediaUploadSync,
} from '@wordpress/react-native-bridge';
import { __ } from '@wordpress/i18n';
import {
	Icon,
	Image,
	ImageEditingButton,
	IMAGE_DEFAULT_FOCAL_POINT,
	PanelBody,
	RangeControl,
	BottomSheet,
	ToolbarButton,
	ToolbarGroup,
	Gradient,
	ColorPalette,
	ColorPicker,
	BottomSheetConsumer,
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
	__experimentalUseEditorFeature as useEditorFeature,
} from '@wordpress/block-editor';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { useEffect, useState, useRef } from '@wordpress/element';
import { cover as icon, replace, image, warning } from '@wordpress/icons';
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
	openGeneralSidebar,
	closeSettingsBottomSheet,
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
	const isImage = backgroundType === MEDIA_TYPE_IMAGE;

	const THEME_COLORS_COUNT = 4;
	const colorsDefault = useEditorFeature( 'color.palette' ) || [];
	const coverDefaultPalette = {
		colors: colorsDefault.slice( 0, THEME_COLORS_COUNT ),
	};

	const { gradientValue } = __experimentalUseGradient();

	const hasBackground = !! (
		url ||
		( style && style.color && style.color.background ) ||
		attributes.overlayColor ||
		overlayColor.color ||
		gradientValue
	);

	const hasOnlyColorBackground = ! url && hasBackground;

	const [
		isCustomColorPickerShowing,
		setCustomColorPickerShowing,
	] = useState( false );

	const [ customColor, setCustomColor ] = useState( '' );

	const openMediaOptionsRef = useRef();

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
		} else if ( isImage && url ) {
			requestImageFullscreenPreview( url );
		}
	};

	const [ isVideoLoading, setIsVideoLoading ] = useState( true );

	const onVideoLoadStart = () => {
		setIsVideoLoading( true );
	};

	const onVideoLoad = () => {
		setIsVideoLoading( false );
	};

	const onClearMedia = () => {
		setAttributes( { id: undefined, url: undefined } );
		closeSettingsBottomSheet();
	};

	function setColor( color ) {
		setAttributes( {
			// clear all related attributes (only one should be set)
			overlayColor: undefined,
			customOverlayColor: color,
			gradient: undefined,
			customGradient: undefined,
		} );
	}

	function openColorPicker() {
		if ( isParentSelected ) {
			setCustomColorPickerShowing( true );
			openGeneralSidebar();
		}
	}

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
		isImage &&
			isParentSelected &&
			! isUploadInProgress &&
			! didUploadFail &&
			styles.overlaySelected,
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

	const addMediaButton = () => (
		<TouchableWithoutFeedback onPress={ openMediaOptionsRef.current }>
			<View style={ styles.selectImageContainer }>
				<View style={ styles.selectImage }>
					<Icon
						size={ 16 }
						icon={ image }
						{ ...styles.selectImageIcon }
					/>
				</View>
			</View>
		</TouchableWithoutFeedback>
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

			{ url ? (
				<PanelBody title={ __( 'Media' ) }>
					<BottomSheet.Cell
						leftAlign
						label={ __( 'Clear Media' ) }
						labelStyle={ styles.clearMediaButton }
						onPress={ onClearMedia }
					/>
				</PanelBody>
			) : null }
		</InspectorControls>
	);

	const colorPickerControls = (
		<InspectorControls>
			<BottomSheetConsumer>
				{ ( {
					shouldEnableBottomSheetScroll,
					shouldEnableBottomSheetMaxHeight,
					onHandleClosingBottomSheet,
					onHandleHardwareButtonPress,
					isBottomSheetContentScrolling,
				} ) => (
					<ColorPicker
						shouldEnableBottomSheetScroll={
							shouldEnableBottomSheetScroll
						}
						shouldEnableBottomSheetMaxHeight={
							shouldEnableBottomSheetMaxHeight
						}
						setColor={ ( color ) => {
							setCustomColor( color );
							setColor( color );
						} }
						onNavigationBack={ closeSettingsBottomSheet }
						onHandleClosingBottomSheet={
							onHandleClosingBottomSheet
						}
						onHandleHardwareButtonPress={
							onHandleHardwareButtonPress
						}
						onBottomSheetClosed={ () => {
							setCustomColorPickerShowing( false );
						} }
						isBottomSheetContentScrolling={
							isBottomSheetContentScrolling
						}
						bottomLabelText={ __( 'Select a color' ) }
					/>
				) }
			</BottomSheetConsumer>
		</InspectorControls>
	);

	const renderContent = ( getMediaOptions ) => (
		<>
			{ renderBackground( getMediaOptions ) }
			{ isParentSelected && hasOnlyColorBackground && addMediaButton() }
		</>
	);

	const renderBackground = ( getMediaOptions ) => (
		<TouchableWithoutFeedback
			accessible={ ! isParentSelected }
			onPress={ onMediaPressed }
			onLongPress={ openMediaOptionsRef.current }
			disabled={ ! isParentSelected }
		>
			<View style={ [ styles.background, backgroundColor ] }>
				{ getMediaOptions() }
				{ isParentSelected &&
					backgroundType === VIDEO_BACKGROUND_TYPE &&
					toolbarControls( openMediaOptionsRef.current ) }
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
					<View style={ styles.imageContainer }>
						<Image
							editButton={ false }
							focalPoint={
								focalPoint || IMAGE_DEFAULT_FOCAL_POINT
							}
							isSelected={ isParentSelected }
							isUploadFailed={ didUploadFail }
							isUploadInProgress={ isUploadInProgress }
							onSelectMediaUploadOption={ onSelectMedia }
							openMediaOptions={ openMediaOptionsRef.current }
							url={ url }
							width={ styles.image.width }
						/>
					</View>
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

	if ( ! hasBackground || isCustomColorPickerShowing ) {
		return (
			<View>
				{ isCustomColorPickerShowing && colorPickerControls }
				<MediaPlaceholder
					height={ styles.mediaPlaceholderEmptyStateContainer.height }
					backgroundColor={ customColor }
					hideContent={
						customColor !== '' && customColor !== undefined
					}
					icon={ placeholderIcon }
					labels={ {
						title: __( 'Cover' ),
					} }
					onSelect={ onSelectMedia }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					onFocus={ onFocus }
				>
					<View style={ styles.colorPaletteWrapper }>
						<BottomSheetConsumer>
							{ ( { shouldEnableBottomSheetScroll } ) => (
								<ColorPalette
									customColorIndicatorStyles={
										styles.paletteColorIndicator
									}
									customIndicatorWrapperStyles={
										styles.paletteCustomIndicatorWrapper
									}
									setColor={ setColor }
									onCustomPress={ openColorPicker }
									defaultSettings={ coverDefaultPalette }
									shouldShowCustomLabel={ false }
									shouldShowCustomVerticalSeparator={ false }
									shouldEnableBottomSheetScroll={
										shouldEnableBottomSheetScroll
									}
								/>
							) }
						</BottomSheetConsumer>
					</View>
				</MediaPlaceholder>
			</View>
		);
	}

	return (
		<View style={ styles.backgroundContainer }>
			{ controls }

			{ isImage &&
				url &&
				openMediaOptionsRef.current &&
				isParentSelected &&
				! isUploadInProgress &&
				! didUploadFail && (
					<View style={ styles.imageEditButton }>
						<ImageEditingButton
							onSelectMediaUploadOption={ onSelectMedia }
							openMediaOptions={ openMediaOptionsRef.current }
							pickerOptions={ [
								{
									destructiveButton: true,
									id: 'clearMedia',
									label: __( 'Clear Media' ),
									onPress: onClearMedia,
									separated: true,
									value: 'clearMedia',
								},
							] }
							url={ url }
						/>
					</View>
				) }

			<View
				pointerEvents="box-none"
				style={ [ styles.content, { minHeight: CONTAINER_HEIGHT } ] }
			>
				<InnerBlocks
					template={ INNER_BLOCKS_TEMPLATE }
					templateInsertUpdatesSelection={ true }
				/>
			</View>

			<View pointerEvents="none" style={ styles.overlayContainer }>
				<View style={ overlayStyles }>
					{ gradientValue && (
						<Gradient
							gradientValue={ gradientValue }
							style={ styles.background }
						/>
					) }
				</View>
			</View>

			<MediaUpload
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				isReplacingMedia={ ! hasOnlyColorBackground }
				onSelect={ onSelectMedia }
				render={ ( { open, getMediaOptions } ) => {
					openMediaOptionsRef.current = open;
					return renderContent( getMediaOptions );
				} }
			/>

			{ shouldShowFailure && (
				<View
					pointerEvents="none"
					style={ styles.uploadFailedContainer }
				>
					<View style={ styles.uploadFailed }>
						<Icon icon={ warning } { ...styles.uploadFailedIcon } />
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

		const { getSettings } = select( 'core/block-editor' );

		return {
			settings: getSettings(),
			isParentSelected: selectedBlockClientId === clientId,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { openGeneralSidebar } = dispatch( 'core/edit-post' );

		return {
			openGeneralSidebar: () => openGeneralSidebar( 'edit-post/block' ),
			closeSettingsBottomSheet() {
				dispatch( 'core/edit-post' ).closeGeneralSidebar();
			},
		};
	} ),
	withPreferredColorScheme,
] )( Cover );
