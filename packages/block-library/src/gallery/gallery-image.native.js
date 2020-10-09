/**
 * External dependencies
 */
import {
	StyleSheet,
	View,
	ScrollView,
	TouchableWithoutFeedback,
} from 'react-native';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
	requestImageFullscreenPreview,
} from '@wordpress/react-native-bridge';
import { useEffect, useState } from '@wordpress/element';
import { Image } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Caption, MediaUploadProgress } from '@wordpress/block-editor';
import { getProtocol } from '@wordpress/url';
import { withPreferredColorScheme } from '@wordpress/compose';
import { arrowLeft, arrowRight, warning } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from './gallery-button';
import style from './gallery-image-style.scss';

const { compose } = StyleSheet;

const separatorStyle = compose( style.separator, {
	borderRightWidth: StyleSheet.hairlineWidth,
} );
const buttonStyle = compose( style.button, { aspectRatio: 1 } );
const ICON_SIZE_ARROW = 15;

function GalleryImage( {
	id,
	url,
	image,
	isSelected,
	isBlockSelected,
	isFirstItem,
	isLastItem,
	caption,
	isCropped,
	getStylesFromColorScheme,
	isRTL,
	'aria-label': ariaLabel,
	onSelect,
	onSelectBlock,
	onRemove,
	onMoveForward,
	onMoveBackward,
	setAttributes,
} ) {
	const [ captionSelected, setCaptionSelected ] = useState( false );
	const [ isUploadInProgress, setIsUploadInProgress ] = useState( false );
	const [ didUploadFail, setDidUploadFail ] = useState( false );

	useEffect( () => {
		if ( image && ! url ) {
			setAttributes( {
				url: image.source_url,
				alt: image.alt_text,
			} );
		}

		// unselect the caption so when the user selects other image and comeback
		// the caption is not immediately selected
		if ( captionSelected && ! isSelected ) {
			setCaptionSelected( false );
		}
	}, [ isSelected, image, url, captionSelected ] );

	const onSelectCaption = () => {
		if ( ! captionSelected ) {
			setCaptionSelected( true );
		}

		if ( ! isSelected ) {
			onSelect();
		}
	};

	const onMediaPressed = () => {
		onSelectImage();

		if ( isUploadInProgress ) {
			requestImageUploadCancelDialog( id );
		} else if (
			didUploadFail ||
			( id && getProtocol( url ) === 'file:' )
		) {
			requestImageFailedRetryDialog( id );
		} else if ( isSelected && ! captionSelected ) {
			requestImageFullscreenPreview( url );
		}
	};

	const onSelectImage = () => {
		if ( ! isBlockSelected ) {
			onSelectBlock();
		}

		if ( ! isSelected ) {
			onSelect();
		}

		if ( captionSelected ) {
			setCaptionSelected( false );
		}
	};

	const onSelectMedia = ( media ) => {
		setAttributes( media );
	};

	const onCaptionChange = ( newCaption ) => {
		setAttributes( { newCaption } );
	};

	const updateMediaProgress = () => {
		if ( ! isUploadInProgress ) {
			setIsUploadInProgress( true );
		}
	};

	const finishMediaUploadWithSuccess = ( payload ) => {
		setIsUploadInProgress( false );
		setDidUploadFail( false );

		setAttributes( {
			id: payload.mediaServerId,
			url: payload.mediaUrl,
		} );
	};

	const finishMediaUploadWithFailure = () => {
		setIsUploadInProgress( false );
		setDidUploadFail( true );
	};

	const renderContent = ( params ) => {
		const { isUploadFailed, retryMessage } = params;
		const resizeMode = isCropped ? 'cover' : 'contain';

		const captionPlaceholderStyle = getStylesFromColorScheme(
			style.captionPlaceholder,
			style.captionPlaceholderDark
		);

		const shouldShowCaptionEditable = ! isUploadFailed && isSelected;
		const shouldShowCaptionExpanded =
			! isUploadFailed && ! isSelected && !! caption;

		const captionContainerStyle = shouldShowCaptionExpanded
			? style.captionExpandedContainer
			: style.captionContainer;

		const captionStyle = shouldShowCaptionExpanded
			? style.captionExpanded
			: style.caption;

		const mediaPickerOptions = [
			{
				destructiveButton: true,
				id: 'removeImage',
				label: __( 'Remove' ),
				onPress: onRemove,
				separated: true,
				value: 'removeImage',
			},
		];

		return (
			<>
				<Image
					alt={ ariaLabel }
					height={ style.image.height }
					isSelected={ isSelected }
					isUploadFailed={ isUploadFailed }
					isUploadInProgress={ isUploadInProgress }
					mediaPickerOptions={ mediaPickerOptions }
					onSelectMediaUploadOption={ onSelectMedia }
					resizeMode={ resizeMode }
					url={ url }
					retryMessage={ retryMessage }
					retryIcon={ warning }
				/>

				{ ! isUploadInProgress && isSelected && (
					<View style={ style.toolbarContainer }>
						<View style={ style.toolbar }>
							<View style={ style.moverButtonContainer }>
								<Button
									style={ buttonStyle }
									icon={ isRTL ? arrowRight : arrowLeft }
									iconSize={ ICON_SIZE_ARROW }
									onClick={
										isFirstItem ? undefined : onMoveBackward
									}
									accessibilityLabel={ __(
										'Move Image Backward'
									) }
									aria-disabled={ isFirstItem }
									disabled={ ! isSelected }
								/>
								<View style={ separatorStyle } />
								<Button
									style={ buttonStyle }
									icon={ isRTL ? arrowLeft : arrowRight }
									iconSize={ ICON_SIZE_ARROW }
									onClick={
										isLastItem ? undefined : onMoveForward
									}
									accessibilityLabel={ __(
										'Move Image Forward'
									) }
									aria-disabled={ isLastItem }
									disabled={ ! isSelected }
								/>
							</View>
						</View>
					</View>
				) }

				{ ! isUploadInProgress &&
					( shouldShowCaptionEditable ||
						shouldShowCaptionExpanded ) && (
						<View style={ captionContainerStyle }>
							<ScrollView
								nestedScrollEnabled
								keyboardShouldPersistTaps="handled"
								bounces={ false }
							>
								<Caption
									inlineToolbar
									isSelected={ captionSelected }
									onChange={ onCaptionChange }
									onFocus={ onSelectCaption }
									placeholder={
										isSelected
											? __( 'Write caption…' )
											: null
									}
									placeholderTextColor={
										captionPlaceholderStyle.color
									}
									style={ captionStyle }
									value={ caption }
								/>
							</ScrollView>
						</View>
					) }
			</>
		);
	};

	const containerStyle = getStylesFromColorScheme(
		style.galleryImageContainer,
		style.galleryImageContainerDark
	);

	const accessibilityLabelImageContainer = () => {
		return isEmpty( caption )
			? ariaLabel
			: ariaLabel +
					'. ' +
					sprintf(
						/* translators: accessibility text. %s: image caption. */
						__( 'Image caption. %s' ),
						caption
					);
	};

	return (
		<TouchableWithoutFeedback
			onPress={ onMediaPressed }
			accessible={ ! isSelected } // We need only child views to be accessible after the selection
			accessibilityLabel={ accessibilityLabelImageContainer() } // if we don't set this explicitly it reads system provided accessibilityLabels of all child components and those include pretty technical words which don't make sense
			accessibilityRole={ 'imagebutton' } // this makes VoiceOver to read a description of image provided by system on iOS and lets user know this is a button which conveys the message of tappablity
		>
			<View style={ containerStyle }>
				<MediaUploadProgress
					mediaId={ id }
					onUpdateMediaProgress={ updateMediaProgress }
					onFinishMediaUploadWithSuccess={
						finishMediaUploadWithSuccess
					}
					onFinishMediaUploadWithFailure={
						finishMediaUploadWithFailure
					}
					onMediaUploadStateReset={ onRemove }
					renderContent={ renderContent }
				/>
			</View>
		</TouchableWithoutFeedback>
	);
}

export default withPreferredColorScheme( GalleryImage );
