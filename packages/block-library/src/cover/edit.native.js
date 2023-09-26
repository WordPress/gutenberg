/**
 * External dependencies
 */
import {
	View,
	TouchableWithoutFeedback,
	InteractionManager,
	AccessibilityInfo,
	Text,
	Platform,
} from 'react-native';
import Video from 'react-native-video';
import classnames from 'classnames/dedupe';

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
	getGradientValueBySlug,
	store as blockEditorStore,
	withColors,
} from '@wordpress/block-editor';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { useDispatch, withSelect, withDispatch } from '@wordpress/data';
import {
	useEffect,
	useState,
	useRef,
	useCallback,
	useMemo,
} from '@wordpress/element';
import { cover as icon, replace, image, warning } from '@wordpress/icons';
import { getProtocol } from '@wordpress/url';
// eslint-disable-next-line no-restricted-imports
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
import {
	compositeIsDark,
	DEFAULT_BACKGROUND_COLOR,
	DEFAULT_OVERLAY_COLOR,
} from './edit/color-utils';

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

function useIsScreenReaderEnabled() {
	const [ isScreenReaderEnabled, setIsScreenReaderEnabled ] =
		useState( false );

	useEffect( () => {
		let mounted = true;

		const changeListener = AccessibilityInfo.addEventListener(
			'screenReaderChanged',
			( enabled ) => setIsScreenReaderEnabled( enabled )
		);

		AccessibilityInfo.isScreenReaderEnabled().then(
			( screenReaderEnabled ) => {
				if ( mounted && screenReaderEnabled ) {
					setIsScreenReaderEnabled( screenReaderEnabled );
				}
			}
		);

		return () => {
			mounted = false;

			changeListener.remove();
		};
	}, [] );

	return isScreenReaderEnabled;
}

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
	overlayColor,
	setOverlayColor,
} ) => {
	const {
		backgroundType,
		dimRatio,
		focalPoint,
		minHeight,
		url,
		id,
		style,
		minHeightUnit = 'px',
		allowedBlocks,
		templateLock,
		customGradient,
		gradient,
		isDark,
		isUserOverlayColor,
	} = attributes;
	const isScreenReaderEnabled = useIsScreenReaderEnabled();

	useEffect( () => {
		// Sync with local media store.
		mediaUploadSync();
	}, [] );

	const convertedMinHeight = useConvertUnitToMobile(
		minHeight || COVER_DEFAULT_HEIGHT,
		minHeightUnit
	);

	const isImage = backgroundType === MEDIA_TYPE_IMAGE;

	const THEME_COLORS_COUNT = 4;
	const colorsDefault = useMobileGlobalStylesColors();
	const coverDefaultPalette = useMemo( () => {
		return {
			colors: colorsDefault.slice( 0, THEME_COLORS_COUNT ),
		};
	}, [ colorsDefault ] );
	const gradients = useMobileGlobalStylesColors( 'gradients' );
	const gradientValue =
		customGradient || getGradientValueBySlug( gradients, gradient );
	const overlayColorValue = overlayColor?.color;

	const hasBackground = !! (
		url ||
		( style && style.color && style.color.background ) ||
		overlayColorValue ||
		gradientValue
	);

	const hasOnlyColorBackground = ! url && ( hasBackground || hasInnerBlocks );

	const [ isCustomColorPickerShowing, setCustomColorPickerShowing ] =
		useState( false );

	const openMediaOptionsRef = useRef();

	// Initialize uploading flag to false, awaiting sync.
	const [ isUploadInProgress, setIsUploadInProgress ] = useState( false );

	// Initialize upload failure flag to true if url is local.
	const [ didUploadFail, setDidUploadFail ] = useState(
		id && getProtocol( url ) === 'file:'
	);

	// Don't show failure if upload is in progress.
	const shouldShowFailure = didUploadFail && ! isUploadInProgress;

	const onSelectMedia = ( newMedia ) => {
		setDidUploadFail( false );
		const mediaAttributes = attributesFromMedia( newMedia );

		// The web version generates the overlay color based on the average color of
		// the background image. On the native version, we don't support this
		// functionality yet so we use the default background color.
		const averageBackgroundColor = DEFAULT_BACKGROUND_COLOR;

		let newOverlayColor = overlayColorValue;
		if ( ! isUserOverlayColor ) {
			newOverlayColor = averageBackgroundColor;
			setOverlayColor( newOverlayColor );

			// Make undo revert the next setAttributes and the previous setOverlayColor.
			__unstableMarkNextChangeAsNotPersistent();
		}

		const newDimRatio = dimRatio === 100 ? 50 : dimRatio;
		const newIsDark = compositeIsDark(
			newDimRatio,
			newOverlayColor,
			averageBackgroundColor
		);

		setAttributes( {
			...mediaAttributes,
			focalPoint: undefined,
			useFeaturedImage: undefined,
			dimRatio: newDimRatio,
			isDark: newIsDark,
		} );
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
		let newOverlayColor = overlayColorValue;
		if ( ! isUserOverlayColor ) {
			newOverlayColor = DEFAULT_OVERLAY_COLOR;
			setOverlayColor( undefined );

			// Make undo revert the next setAttributes and the previous setOverlayColor.
			__unstableMarkNextChangeAsNotPersistent();
		}

		const newIsDark = compositeIsDark(
			dimRatio,
			newOverlayColor,
			DEFAULT_BACKGROUND_COLOR
		);

		setAttributes( {
			url: undefined,
			id: undefined,
			backgroundType: undefined,
			focalPoint: undefined,
			hasParallax: undefined,
			isRepeated: undefined,
			useFeaturedImage: undefined,
			isDark: newIsDark,
		} );

		closeSettingsBottomSheet();
	}, [
		__unstableMarkNextChangeAsNotPersistent,
		closeSettingsBottomSheet,
		dimRatio,
		isUserOverlayColor,
		overlayColorValue,
		setAttributes,
		setOverlayColor,
	] );

	const onSetOverlayColor = useCallback(
		( newOverlayColor ) => {
			// Do nothing for falsy values.
			if ( ! newOverlayColor ) {
				return;
			}

			// The web version generates the overlay color based on the average color of
			// the background image. On the native version, we don't support this
			// functionality yet so we use the default background color.
			const averageBackgroundColor = DEFAULT_BACKGROUND_COLOR;
			const newIsDark = compositeIsDark(
				dimRatio,
				newOverlayColor,
				averageBackgroundColor
			);

			setOverlayColor( newOverlayColor );

			// Make undo revert the next setAttributes and the previous setOverlayColor.
			__unstableMarkNextChangeAsNotPersistent();

			setAttributes( {
				isUserOverlayColor: true,
				isDark: newIsDark,
				gradient: undefined,
				customGradient: undefined,
			} );
		},
		[
			__unstableMarkNextChangeAsNotPersistent,
			dimRatio,
			setAttributes,
			setOverlayColor,
		]
	);

	const onUpdateDimRatio = useCallback(
		( newDimRatio ) => {
			// The web version generates the overlay color based on the average color of
			// the background image. On the native version, we don't support this
			// functionality yet so we use the default background color.
			const averageBackgroundColor = DEFAULT_BACKGROUND_COLOR;
			const newIsDark = compositeIsDark(
				newDimRatio,
				overlayColorValue,
				averageBackgroundColor
			);

			setAttributes( {
				dimRatio: newDimRatio,
				isDark: newIsDark,
			} );
		},
		[ overlayColorValue, setAttributes ]
	);

	function openColorPicker() {
		selectBlock();
		setCustomColorPickerShowing( true );
		openGeneralSidebar();
	}

	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	useEffect( () => {
		// This side-effect should not create an undo level.
		__unstableMarkNextChangeAsNotPersistent();
		// Used to set a default color for its InnerBlocks
		// since there's no system to inherit styles yet
		// the RichText component will check if there are
		// parent styles for the current block. If there are,
		// it will use that color instead.
		setAttributes( {
			childrenStyles: isDark
				? styles.defaultColor
				: styles.defaultColorLightMode,
		} );

		// Ensure that "is-light" is removed from "className" attribute if cover background is dark.
		if ( isDark && attributes.className?.includes( 'is-light' ) ) {
			const className = classnames( attributes.className, {
				'is-light': false,
			} );
			setAttributes( {
				className: className !== '' ? className : undefined,
			} );
		}
	}, [
		__unstableMarkNextChangeAsNotPersistent,
		attributes.className,
		isDark,
		setAttributes,
	] );

	const backgroundColor = getStylesFromColorScheme(
		styles.backgroundSolid,
		styles.backgroundSolidDark
	);

	const overlayStyles = [
		styles.overlay,
		url && { opacity: dimRatio / 100 },
		! gradientValue && {
			backgroundColor:
				overlayColorValue ||
				style?.color?.background ||
				styles.overlay?.color,
		},
		// While we don't support theme colors we add a default bg color.
		! overlayColorValue && ! url ? backgroundColor : {},
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

	const selectedColorText = getStylesFromColorScheme(
		styles.selectedColorText,
		styles.selectedColorTextDark
	);

	const bottomLabelText = overlayColorValue ? (
		<Text style={ selectedColorText }>
			{ overlayColorValue.toUpperCase() }
		</Text>
	) : (
		__( 'Select a color' )
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
						setColor={ onSetOverlayColor }
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
						bottomLabelText={ bottomLabelText }
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
							// Hide Video component since it has black background while loading the source.
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
					backgroundColor={ overlayColorValue }
					hideContent={ !! overlayColorValue }
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
									setColor={ onSetOverlayColor }
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
						setOverlayColor={ onSetOverlayColor }
						updateDimRatio={ onUpdateDimRatio }
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
	withColors( { overlayColor: 'background-color' } ),
	withSelect( ( select, { clientId } ) => {
		const { getSelectedBlockClientId, getBlock } =
			select( blockEditorStore );

		const selectedBlockClientId = getSelectedBlockClientId();

		const hasInnerBlocks = getBlock( clientId )?.innerBlocks.length > 0;

		return {
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
