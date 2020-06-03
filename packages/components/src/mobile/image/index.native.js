/**
 * External dependencies
 */
import { Image, Text, TouchableWithoutFeedback, View } from 'react-native';

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
import { MediaEdit } from '../media-edit';
import { getImageWithFocalPointStyles } from '../image-with-focalpoint';
import styles from './style.scss';
import SvgIconRetry from './icon-retry';
import SvgIconCustomize from './icon-customize';

const ICON_TYPE = {
	PLACEHOLDER: 'placeholder',
	RETRY: 'retry',
	UPLOAD: 'upload',
};

function editImageComponent( { open, mediaOptions } ) {
	return (
		<TouchableWithoutFeedback onPress={ open }>
			<View style={ styles.editContainer }>
				<View style={ styles.edit }>
					{ mediaOptions() }
					<Icon
						size={ 16 }
						icon={ SvgIconCustomize }
						{ ...styles.iconCustomise }
					/>
				</View>
			</View>
		</TouchableWithoutFeedback>
	);
}

const ImageComponent = ( {
	align,
	alt,
	isSelected,
	isUploadFailed,
	isUploadInProgress,
	onSelectMediaUploadOption,
	openMediaOptions,
	retryMessage,
	url,
	width: imageWidth,
	height: imageHeight,
	focalPoint,
} ) => {
	const [ imageData, setImageData ] = useState( null );
	const [ containerSize, setContainerSize ] = useState( null );

	useEffect( () => {
		if ( url ) {
			Image.getSize( url, ( imgWidth, imgHeight ) => {
				setImageData( {
					aspectRatio: imgWidth / imgHeight,
					width: imgWidth,
					height: imgHeight,
				} );
			} );
		}
	}, [ url ] );

	const onContainerLayout = ( event ) => {
		const { height, width } = event.nativeEvent.layout;
		setContainerSize( { width, height } );
	};

	const getIcon = ( iconType ) => {
		let iconStyle;
		switch ( iconType ) {
			case ICON_TYPE.RETRY:
				return <Icon icon={ SvgIconRetry } { ...styles.iconRetry } />;
			case ICON_TYPE.PLACEHOLDER:
				iconStyle = iconPlaceholderStyles;
				break;
			case ICON_TYPE.UPLOAD:
				iconStyle = iconUploadStyles;
				break;
		}
		return <Icon icon={ icon } { ...iconStyle } />;
	};

	const alignToFlex = {
		left: 'flex-start',
		center: 'center',
		right: 'flex-end',
		full: 'center',
		wide: 'center',
	};

	const iconPlaceholderStyles = usePreferredColorSchemeStyle(
		styles.iconPlaceholder,
		styles.iconPlaceholderDark
	);

	const iconUploadStyles = usePreferredColorSchemeStyle(
		styles.iconUpload,
		styles.iconUploadDark
	);

	const customWidth =
		imageData?.width < containerSize?.width ? imageData?.width : '100%';

	const imageContainerStyles = [
		styles.imageContent,
		focalPoint && styles.imageWithFocalPoint,
		{
			width:
				imageWidth > 0 && imageWidth < containerSize?.width
					? imageWidth
					: customWidth,
			height:
				imageHeight > 0 && imageHeight < containerSize?.height
					? imageHeight
					: undefined,
		},
	];

	const placeholderStyles = usePreferredColorSchemeStyle(
		styles.imageContainerUpload,
		styles.imageContainerUploadDark
	);

	const imageStyles = [
		{
			aspectRatio: imageData?.aspectRatio,
			opacity: isUploadInProgress ? 0.3 : 1,
		},
		focalPoint &&
			getImageWithFocalPointStyles(
				focalPoint,
				containerSize,
				imageData
			),
	];

	return (
		<View
			style={ {
				flex: 1,
				// only set alignItems if an image exists because alignItems causes the placeholder
				// to disappear when an aligned image can't be downloaded
				// https://github.com/wordpress-mobile/gutenberg-mobile/issues/1592
				alignItems: imageData && align && alignToFlex[ align ],
			} }
			onLayout={ onContainerLayout }
		>
			<View
				accessible={ true }
				disabled={ ! isSelected }
				accessibilityLabel={ alt }
				accessibilityHint={ __( 'Double tap and hold to edit' ) }
				accessibilityRole={ 'imagebutton' }
				key={ url }
				style={ imageContainerStyles }
			>
				{ ! imageData && (
					<View style={ placeholderStyles }>
						<View style={ styles.imageUploadingIconContainer }>
							{ getIcon( ICON_TYPE.UPLOAD ) }
						</View>
					</View>
				) }

				{ isSelected && ! ( isUploadInProgress || isUploadFailed ) && (
					<View style={ styles.imageBorder } />
				) }

				<Image
					style={ containerSize && imageStyles }
					resizeMethod={ ! focalPoint && 'scale' }
					source={ { uri: url } }
				/>

				{ isUploadFailed && (
					<View
						style={ [
							styles.imageContainer,
							styles.retryContainer,
						] }
					>
						<View style={ styles.modalIcon }>
							{ getIcon( ICON_TYPE.RETRY ) }
						</View>
						<Text style={ styles.uploadFailedText }>
							{ retryMessage }
						</Text>
					</View>
				) }
				{ isSelected &&
					! isUploadInProgress &&
					! isUploadFailed &&
					( imageData || focalPoint ) && (
						<MediaEdit
							onSelect={ onSelectMediaUploadOption }
							source={ { uri: url } }
							openReplaceMediaOptions={ openMediaOptions }
							render={ editImageComponent }
						/>
					) }
			</View>
		</View>
	);
};

export default ImageComponent;
