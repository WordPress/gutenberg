/**
 * External dependencies
 */
import {
	View,
	TouchableWithoutFeedback,
	InteractionManager,
	AccessibilityInfo,
	Platform,
} from 'react-native';
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
	ToolbarButton,
	Gradient,
	ColorPalette,
	ColorPicker,
	BottomSheetConsumer,
	useConvertUnitToMobile,
	useMobileGlobalStylesColors,
} from '@wordpress/components';
import {
	BlockControls,
	InnerBlocks,
	InspectorControls,
	MEDIA_TYPE_IMAGE,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadProgress,
	getColorObjectByColorValue,
	getColorObjectByAttributeValues,
	getGradientValueBySlug,
	useSetting,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { useEffect, useState, useRef, useCallback } from '@wordpress/element';
import { cover as icon, replace, image, warning } from '@wordpress/icons';
import { getProtocol } from '@wordpress/url';
import { store as editPostStore } from '@wordpress/edit-post';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import {
	attributesFromMedia,
	ALLOWED_MEDIA_TYPES,
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
	COVER_DEFAULT_HEIGHT,
} from './shared';
import Controls from './controls';

/**
 * Constants
 */
const INNER_BLOCKS_TEMPLATE = [
	[
		'core/paragraph',
		{
			align: 'center',
			placeholder: __( 'Write title…' ),
		},
	],
];

const Cover = ( {
	attributes,
	getStylesFromColorScheme,
	isParentSelected,
	onFocus,
	setAttributes,
	openGeneralSidebar,
	closeSettingsBottomSheet,
	isSelected,
	selectBlock,
	blockWidth,
	hasInnerBlocks,
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
		minHeightUnit = 'px',
		allowedBlocks,
		templateLock,
		customGradient,
		gradient,
		overlayColor,
	} = attributes;
	const [ isScreenReaderEnabled, setIsScreenReaderEnabled ] = useState(
		false
	);

	useEffect( () => {
		let isCurrent = true;

		// sync with local media store
		mediaUploadSync();
		const a11yInfoChangeSubscription = AccessibilityInfo.addEventListener(
			'screenReaderChanged',
			setIsScreenReaderEnabled
		);

		AccessibilityInfo.isScreenReaderEnabled().then( () => {
			if ( isCurrent ) {
				setIsScreenReaderEnabled();
			}
		} );

		return () => {
			isCurrent = false;
			a11yInfoChangeSubscription.remove();
		};
	}, [] );

	const convertedMinHeight = useConvertUnitToMobile(
		minHeight || COVER_DEFAULT_HEIGHT,
		minHeightUnit
	);

	const isImage = backgroundType === MEDIA_TYPE_IMAGE;

	const THEME_COLORS_COUNT = 4;
	const colorsDefault = useMobileGlobalStylesColors().reverse();
	const coverDefaultPalette = {
		colors: colorsDefault.slice( 0, THEME_COLORS_COUNT ),
	};
	const gradients = useSetting( 'color.gradients' ) || [];
	const gradientValue =
		customGradient || getGradientValueBySlug( gradients, gradient );
	const overlayColorValue = getColorObjectByAttributeValues(
		colorsDefault,
		overlayColor
	);

	const hasBackground = !! (
		url ||
		( style && style.color && style.color.background ) ||
		attributes.overlayColor ||
		overlayColorValue.color ||
		customOverlayColor ||
		gradientValue
	);

	const hasOnlyColorBackground = ! url && ( hasBackground || hasInnerBlocks );

	const [
		isCustomColorPickerShowing,
		setCustomColorPickerShowing,
	] = useState( false );

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
		const onSelect = attributesFromMedia( setAttributes, dimRatio );
		onSelect( media );
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

	const onClearMedia = useCallback( () => {
		setAttributes( {
			focalPoint: undefined,
			hasParallax: undefined,
			id: undefined,
			url: undefined,
		} );
		closeSettingsBottomSheet();
	}, [ closeSettingsBottomSheet ] );

	function setColor( color ) {
		const colorValue = getColorObjectByColorValue( colorsDefault, color );

		setAttributes( {
			// clear all related attributes (only one should be set)
			overlayColor: colorValue?.slug ?? undefined,
			customOverlayColor: ( ! colorValue?.slug && color ) ?? undefined,
			gradient: undefined,
			customGradient: undefined,
		} );
	}

	function openColorPicker() {
		selectBlock();
		setCustomColorPickerShowing( true );
		openGeneralSidebar();
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
				overlayColorValue?.color ||
				style?.color?.background ||
				styles.overlay?.color,
		},
		// While we don't support theme colors we add a default bg color
		! overlayColorValue.color && ! url ? backgroundColor : {},
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
		<BlockControls group="other">
			<ToolbarButton
				title={ __( 'Edit cover media' ) }
				icon={ replace }
				onClick={ open }
			/>
		</BlockControls>
	);

	const accessibilityHint =
		Platform.OS === 'ios'
			? __( 'Double tap to open Action Sheet to add image or video' )
			: __( 'Double tap to open Bottom Sheet to add image or video' );

	const addMediaButton = () => (
		<TouchableWithoutFeedback
			accessibilityHint={ accessibilityHint }
			accessibilityLabel={ __( 'Add image or video' ) }
			accessibilityRole="button"
			onPress={ openMediaOptionsRef.current }
		>
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

	const onBottomSheetClosed = useCallback( () => {
		InteractionManager.runAfterInteractions( () => {
			setCustomColorPickerShowing( false );
		} );
	}, [] );

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
						setColor={ setColor }
						onNavigationBack={ closeSettingsBottomSheet }
						onHandleClosingBottomSheet={
							onHandleClosingBottomSheet
						}
						onHandleHardwareButtonPress={
							onHandleHardwareButtonPress
						}
						onBottomSheetClosed={ onBottomSheetClosed }
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
							width={ styles.image?.width }
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

	if (
		( ! hasBackground && ! hasInnerBlocks ) ||
		isCustomColorPickerShowing
	) {
		return (
			<View>
				{ isCustomColorPickerShowing && colorPickerControls }
				<MediaPlaceholder
					height={
						styles.mediaPlaceholderEmptyStateContainer?.height
					}
					backgroundColor={ customOverlayColor }
					hideContent={
						customOverlayColor !== '' &&
						customOverlayColor !== undefined
					}
					icon={ placeholderIcon }
					labels={ {
						title: __( 'Cover' ),
					} }
					onSelect={ onSelectMedia }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					onFocus={ onFocus }
				>
					<View
						style={ styles.colorPaletteWrapper }
						pointerEvents={
							isScreenReaderEnabled ? 'none' : 'auto'
						}
					>
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
			{ isSelected && (
				<InspectorControls>
					<Controls
						attributes={ attributes }
						didUploadFail={ didUploadFail }
						hasOnlyColorBackground={ hasOnlyColorBackground }
						isUploadInProgress={ isUploadInProgress }
						onClearMedia={ onClearMedia }
						onSelectMedia={ onSelectMedia }
						setAttributes={ setAttributes }
					/>
				</InspectorControls>
			) }

			<View
				pointerEvents="box-none"
				style={ [ styles.content, { minHeight: convertedMinHeight } ] }
			>
				<InnerBlocks
					allowedBlocks={ allowedBlocks }
					template={ INNER_BLOCKS_TEMPLATE }
					templateLock={ templateLock }
					templateInsertUpdatesSelection
					blockWidth={ blockWidth }
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
	withSelect( ( select, { clientId } ) => {
		const { getSelectedBlockClientId, getBlock } = select(
			blockEditorStore
		);

		const selectedBlockClientId = getSelectedBlockClientId();

		const { getSettings } = select( blockEditorStore );

		const hasInnerBlocks = getBlock( clientId )?.innerBlocks.length > 0;

		return {
			settings: getSettings(),
			isParentSelected: selectedBlockClientId === clientId,
			hasInnerBlocks,
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		const { openGeneralSidebar } = dispatch( editPostStore );
		const { selectBlock } = dispatch( blockEditorStore );

		return {
			openGeneralSidebar: () => openGeneralSidebar( 'edit-post/block' ),
			closeSettingsBottomSheet() {
				dispatch( editPostStore ).closeGeneralSidebar();
			},
			selectBlock: () => selectBlock( clientId ),
		};
	} ),
	withPreferredColorScheme,
] )( Cover );
