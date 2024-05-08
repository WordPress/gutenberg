/**
 * External dependencies
 */
import { Image as RNImage, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/components';
import { image, offline } from '@wordpress/icons';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { useEffect, useState, Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getImageWithFocalPointStyles } from './utils';
import styles from './style.scss';
import SvgIconRetry from './icon-retry';
import ImageEditingButton from './image-editing-button';

const ICON_TYPE = {
	OFFLINE: 'offline',
	PLACEHOLDER: 'placeholder',
	RETRY: 'retry',
	UPLOAD: 'upload',
};

const ImageComponent = ( {
	align,
	alt,
	editButton = true,
	focalPoint,
	height: imageHeight,
	highlightSelected = true,
	isSelected,
	shouldUseFastImage,
	isUploadFailed,
	isUploadPaused,
	isUploadInProgress,
	mediaPickerOptions,
	onImageDataLoad,
	onSelectMediaUploadOption,
	openMediaOptions,
	resizeMode,
	retryMessage,
	retryIcon,
	url,
	shapeStyle,
	style,
	width: imageWidth,
} ) => {
	const [ imageData, setImageData ] = useState( null );
	const [ containerSize, setContainerSize ] = useState( null );
	const [ localURL, setLocalURL ] = useState( null );
	const [ networkURL, setNetworkURL ] = useState( null );
	const [ networkImageLoaded, setNetworkImageLoaded ] = useState( false );

	// Disabled for Android due to https://github.com/WordPress/gutenberg/issues/43149
	const Image =
		! shouldUseFastImage || Platform.isAndroid ? RNImage : FastImage;
	const imageResizeMode =
		! shouldUseFastImage || Platform.isAndroid
			? resizeMode
			: FastImage.resizeMode[ resizeMode ];

	useEffect( () => {
		let isCurrent = true;
		if ( url ) {
			RNImage.getSize( url, ( imgWidth, imgHeight ) => {
				if ( ! isCurrent ) {
					return;
				}
				const metaData = {
					aspectRatio: imgWidth / imgHeight,
					width: imgWidth,
					height: imgHeight,
				};
				setImageData( metaData );
				if ( onImageDataLoad ) {
					onImageDataLoad( metaData );
				}
			} );

			if ( url.startsWith( 'file:///' ) ) {
				setLocalURL( url );
				setNetworkURL( null );
				setNetworkImageLoaded( false );
			} else if ( url.startsWith( 'https://' ) ) {
				if ( Platform.isIOS ) {
					setNetworkURL( url );
				} else if ( Platform.isAndroid ) {
					RNImage.prefetch( url ).then(
						() => {
							if ( ! isCurrent ) {
								return;
							}
							setNetworkURL( url );
							setNetworkImageLoaded( true );
						},
						() => {
							// This callback is called when the image fails to load,
							// but these events are handled by `isUploadFailed`
							// and `isUploadPaused` events instead.
							//
							// Ignoring the error event will persist the local image URI.
						}
					);
				}
			}
		}
		return () => ( isCurrent = false );
		// Disable reason: deferring this refactor to the native team.
		// see https://github.com/WordPress/gutenberg/pull/41166
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ url ] );

	const onContainerLayout = ( event ) => {
		const { height, width } = event.nativeEvent.layout;

		if (
			width !== 0 &&
			height !== 0 &&
			( containerSize?.width !== width ||
				containerSize?.height !== height )
		) {
			setContainerSize( { width, height } );
		}
	};

	const getIcon = ( iconType ) => {
		let icon;
		let iconStyle;
		switch ( iconType ) {
			case ICON_TYPE.RETRY:
				icon = retryIcon || SvgIconRetry;
				iconStyle = iconRetryStyles;
				break;
			case ICON_TYPE.OFFLINE:
				icon = offline;
				iconStyle = iconOfflineStyles;
				break;
			case ICON_TYPE.PLACEHOLDER:
				icon = image;
				iconStyle = iconPlaceholderStyles;
				break;
			case ICON_TYPE.UPLOAD:
				icon = image;
				iconStyle = iconUploadStyles;
				break;
		}
		return <Icon icon={ icon } { ...iconStyle } />;
	};

	const iconPlaceholderStyles = usePreferredColorSchemeStyle(
		styles.iconPlaceholder,
		styles.iconPlaceholderDark
	);

	const iconUploadStyles = usePreferredColorSchemeStyle(
		styles.iconUpload,
		styles.iconUploadDark
	);

	const iconOfflineStyles = usePreferredColorSchemeStyle(
		styles.iconOffline,
		styles.iconOfflineDark
	);

	const retryIconStyles = usePreferredColorSchemeStyle(
		styles.retryIcon,
		styles.retryIconDark
	);

	const iconRetryStyles = usePreferredColorSchemeStyle(
		styles.iconRetry,
		styles.iconRetryDark
	);

	const retryContainerStyles = usePreferredColorSchemeStyle(
		styles.retryContainer,
		styles.retryContainerDark
	);

	const uploadFailedTextStyles = usePreferredColorSchemeStyle(
		styles.uploadFailedText,
		styles.uploadFailedTextDark
	);

	const placeholderStyles = [
		usePreferredColorSchemeStyle(
			styles.imageContainerUpload,
			styles.imageContainerUploadDark
		),
		focalPoint && styles.imageContainerUploadWithFocalpoint,
		imageHeight && { height: imageHeight },
	];

	const customWidth =
		imageData?.width < containerSize?.width
			? imageData?.width
			: styles.wide?.width;

	const imageContainerStyles = [
		styles.imageContent,
		{
			width:
				imageWidth === styles.wide?.width ||
				( imageData &&
					imageWidth > 0 &&
					imageWidth < containerSize?.width )
					? imageWidth
					: customWidth,
		},
		resizeMode && { width: styles.wide?.width },
		focalPoint && styles.focalPointContainer,
	];

	const imageStyles = [
		{
			height: containerSize?.height,
		},
		! resizeMode && {
			aspectRatio: imageData?.aspectRatio,
		},
		focalPoint && styles.focalPoint,
		focalPoint &&
			getImageWithFocalPointStyles(
				focalPoint,
				containerSize,
				imageData
			),
		! focalPoint &&
			imageData &&
			containerSize && {
				height:
					imageData?.width > containerSize?.width && ! imageWidth
						? containerSize?.width / imageData?.aspectRatio
						: undefined,
			},
		imageHeight && { height: imageHeight },
		shapeStyle,
	];

	// On iOS, add 1 to height to account for the 1px non-visible image
	// that is used to determine when the network image has loaded
	// We also must verify that it is not NaN, as it can be NaN when the image is loading.
	// This is not necessary on Android as the non-visible image is not used.
	let calculatedSelectedHeight;
	if ( Platform.isIOS ) {
		calculatedSelectedHeight =
			containerSize && ! isNaN( containerSize.height )
				? containerSize.height + 1
				: 0;
	} else {
		calculatedSelectedHeight = containerSize?.height;
	}

	const imageSelectedStyles = [
		usePreferredColorSchemeStyle(
			styles.imageBorder,
			styles.imageBorderDark
		),
		{
			height: calculatedSelectedHeight,
		},
	];

	return (
		<View
			style={ [
				styles.container,
				// Only set alignItems if an image exists because alignItems causes the placeholder
				// to disappear when an aligned image can't be downloaded
				// https://github.com/wordpress-mobile/gutenberg-mobile/issues/1592
				imageData && align && { alignItems: align },
				style,
			] }
			onLayout={ onContainerLayout }
		>
			<View
				accessible
				disabled={ ! isSelected }
				accessibilityLabel={ alt }
				accessibilityHint={ __( 'Double tap and hold to edit' ) }
				accessibilityRole={ 'imagebutton' }
				key={ url }
				style={ imageContainerStyles }
			>
				{ isSelected && highlightSelected && (
					<View style={ imageSelectedStyles } />
				) }

				{ ! imageData ? (
					<View style={ placeholderStyles }>
						<View style={ styles.imageUploadingIconContainer }>
							{ getIcon( ICON_TYPE.UPLOAD ) }
						</View>
					</View>
				) : (
					<View style={ focalPoint && styles.focalPointContent }>
						{ Platform.isAndroid && (
							<>
								{ networkImageLoaded && networkURL && (
									<Image
										style={ imageStyles }
										fadeDuration={ 0 }
										source={ { uri: networkURL } }
										{ ...( ! focalPoint && {
											resizeMethod: 'scale',
										} ) }
										resizeMode={ imageResizeMode }
										testID={ `network-image-${ url }` }
									/>
								) }
								{ ! networkImageLoaded && ! networkURL && (
									<Image
										style={ imageStyles }
										fadeDuration={ 0 }
										source={ { uri: localURL } }
										{ ...( ! focalPoint && {
											resizeMethod: 'scale',
										} ) }
										resizeMode={ imageResizeMode }
									/>
								) }
							</>
						) }
						{ Platform.isIOS && (
							<>
								<Image
									style={ imageStyles }
									source={ {
										uri:
											networkURL && networkImageLoaded
												? networkURL
												: localURL || url,
									} }
									{ ...( ! focalPoint && {
										resizeMethod: 'scale',
									} ) }
									resizeMode={ imageResizeMode }
									testID={ `network-image-${
										networkURL && networkImageLoaded
											? networkURL
											: localURL || url
									}` }
								/>
								<Image
									source={ { uri: networkURL } }
									style={ styles.nonVisibleImage }
									onLoad={ () => {
										setNetworkImageLoaded( true );
									} }
								/>
							</>
						) }
					</View>
				) }

				{ ( isUploadFailed || isUploadPaused ) && retryMessage && (
					<View
						style={ [
							styles.imageContainer,
							retryContainerStyles,
						] }
					>
						<View
							style={ [
								retryIconStyles,
								retryIcon && styles.customRetryIcon,
							] }
						>
							{ isUploadPaused
								? getIcon( ICON_TYPE.OFFLINE )
								: getIcon( ICON_TYPE.RETRY ) }
						</View>
						<Text style={ uploadFailedTextStyles }>
							{ retryMessage }
						</Text>
					</View>
				) }
			</View>

			{ editButton && isSelected && ! isUploadInProgress && (
				<ImageEditingButton
					onSelectMediaUploadOption={ onSelectMediaUploadOption }
					openMediaOptions={ openMediaOptions }
					url={
						! ( isUploadFailed || isUploadPaused ) &&
						imageData &&
						url
					}
					pickerOptions={ mediaPickerOptions }
				/>
			) }
		</View>
	);
};

export default ImageComponent;
