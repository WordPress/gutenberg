/**
 * External dependencies
 */
import { Image, Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/components';
import { image as icon } from '@wordpress/icons';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getImageWithFocalPointStyles } from './utils';
import styles from './style.scss';
import SvgIconRetry from './icon-retry';
import ImageEditingButton from './image-editing-button';

const ICON_TYPE = {
	PLACEHOLDER: 'placeholder',
	RETRY: 'retry',
	UPLOAD: 'upload',
};

export const IMAGE_DEFAULT_FOCAL_POINT = { x: 0.5, y: 0.5 };

const ImageComponent = ( {
	align,
	alt,
	editButton = true,
	focalPoint,
	height: imageHeight,
	highlightSelected = true,
	isSelected,
	isUploadFailed,
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

	useEffect( () => {
		let isCurrent = true;
		if ( url ) {
			Image.getSize( url, ( imgWidth, imgHeight ) => {
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
		}
		return () => ( isCurrent = false );
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
		let iconStyle;
		switch ( iconType ) {
			case ICON_TYPE.RETRY:
				return (
					<Icon
						icon={ retryIcon || SvgIconRetry }
						{ ...styles.iconRetry }
					/>
				);
			case ICON_TYPE.PLACEHOLDER:
				iconStyle = iconPlaceholderStyles;
				break;
			case ICON_TYPE.UPLOAD:
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
			opacity: isUploadInProgress ? 0.3 : 1,
			height: containerSize?.height,
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
					imageData?.width > containerSize?.width
						? containerSize?.width / imageData?.aspectRatio
						: undefined,
			},
		imageHeight && { height: imageHeight },
		shapeStyle,
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
				{ isSelected &&
					highlightSelected &&
					! ( isUploadInProgress || isUploadFailed ) && (
						<View
							style={ [
								styles.imageBorder,
								{ height: containerSize?.height },
							] }
						/>
					) }

				{ ! imageData ? (
					<View style={ placeholderStyles }>
						<View style={ styles.imageUploadingIconContainer }>
							{ getIcon( ICON_TYPE.UPLOAD ) }
						</View>
					</View>
				) : (
					<View style={ focalPoint && styles.focalPointContent }>
						<Image
							{ ...( ! resizeMode && {
								aspectRatio: imageData?.aspectRatio,
							} ) }
							style={ imageStyles }
							source={ { uri: url } }
							{ ...( ! focalPoint && {
								resizeMethod: 'scale',
							} ) }
							resizeMode={ resizeMode }
						/>
					</View>
				) }

				{ isUploadFailed && retryMessage && (
					<View
						style={ [
							styles.imageContainer,
							styles.retryContainer,
						] }
					>
						<View
							style={ [
								styles.retryIcon,
								retryIcon && styles.customRetryIcon,
							] }
						>
							{ getIcon( ICON_TYPE.RETRY ) }
						</View>
						<Text style={ styles.uploadFailedText }>
							{ retryMessage }
						</Text>
					</View>
				) }
			</View>

			{ editButton && isSelected && ! isUploadInProgress && (
				<ImageEditingButton
					onSelectMediaUploadOption={ onSelectMediaUploadOption }
					openMediaOptions={ openMediaOptions }
					url={ ! isUploadFailed && imageData && url }
					pickerOptions={ mediaPickerOptions }
				/>
			) }
		</View>
	);
};

export default ImageComponent;
