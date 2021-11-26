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
import { Component } from '@wordpress/element';
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

class GalleryImage extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectImage = this.onSelectImage.bind( this );
		this.onSelectCaption = this.onSelectCaption.bind( this );
		this.onMediaPressed = this.onMediaPressed.bind( this );
		this.onCaptionChange = this.onCaptionChange.bind( this );
		this.onSelectMedia = this.onSelectMedia.bind( this );

		this.updateMediaProgress = this.updateMediaProgress.bind( this );
		this.finishMediaUploadWithSuccess = this.finishMediaUploadWithSuccess.bind(
			this
		);
		this.finishMediaUploadWithFailure = this.finishMediaUploadWithFailure.bind(
			this
		);
		this.renderContent = this.renderContent.bind( this );

		this.state = {
			captionSelected: false,
			isUploadInProgress: false,
			didUploadFail: false,
		};
	}

	onSelectCaption() {
		if ( ! this.state.captionSelected ) {
			this.setState( {
				captionSelected: true,
			} );
		}

		if ( ! this.props.isSelected ) {
			this.props.onSelect();
		}
	}

	onMediaPressed() {
		const { id, url, isSelected } = this.props;
		const {
			captionSelected,
			isUploadInProgress,
			didUploadFail,
		} = this.state;

		this.onSelectImage();

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
	}

	onSelectImage() {
		if ( ! this.props.isBlockSelected ) {
			this.props.onSelectBlock();
		}

		if ( ! this.props.isSelected ) {
			this.props.onSelect();
		}

		if ( this.state.captionSelected ) {
			this.setState( {
				captionSelected: false,
			} );
		}
	}

	onSelectMedia( media ) {
		const { setAttributes } = this.props;
		setAttributes( media );
	}

	onCaptionChange( caption ) {
		const { setAttributes } = this.props;
		setAttributes( { caption } );
	}

	componentDidUpdate( prevProps ) {
		const { isSelected, image, url } = this.props;
		if ( image && ! url ) {
			this.props.setAttributes( {
				url: image.source_url,
				alt: image.alt_text,
			} );
		}

		// Unselect the caption so when the user selects other image and comeback
		// the caption is not immediately selected.
		if (
			this.state.captionSelected &&
			! isSelected &&
			prevProps.isSelected
		) {
			this.setState( {
				captionSelected: false,
			} );
		}
	}

	updateMediaProgress() {
		if ( ! this.state.isUploadInProgress ) {
			this.setState( { isUploadInProgress: true } );
		}
	}

	finishMediaUploadWithSuccess( payload ) {
		this.setState( {
			isUploadInProgress: false,
			didUploadFail: false,
		} );

		this.props.setAttributes( {
			id: payload.mediaServerId,
			url: payload.mediaUrl,
		} );
	}

	finishMediaUploadWithFailure() {
		this.setState( {
			isUploadInProgress: false,
			didUploadFail: true,
		} );
	}

	renderContent( params ) {
		const {
			url,
			isFirstItem,
			isLastItem,
			isSelected,
			caption,
			onRemove,
			onMoveForward,
			onMoveBackward,
			'aria-label': ariaLabel,
			isCropped,
			getStylesFromColorScheme,
			isRTL,
		} = this.props;

		const { isUploadInProgress, captionSelected } = this.state;
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
					onSelectMediaUploadOption={ this.onSelectMedia }
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
									isSelected={ isSelected && captionSelected }
									onChange={ this.onCaptionChange }
									onFocus={ this.onSelectCaption }
									placeholder={
										isSelected ? __( 'Add caption' ) : null
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
	}

	render() {
		const {
			id,
			onRemove,
			getStylesFromColorScheme,
			isSelected,
		} = this.props;

		const containerStyle = getStylesFromColorScheme(
			style.galleryImageContainer,
			style.galleryImageContainerDark
		);

		return (
			<TouchableWithoutFeedback
				onPress={ this.onMediaPressed }
				accessible={ ! isSelected } // We need only child views to be accessible after the selection.
				accessibilityLabel={ this.accessibilityLabelImageContainer() } // if we don't set this explicitly it reads system provided accessibilityLabels of all child components and those include pretty technical words which don't make sense
				accessibilityRole={ 'imagebutton' } // this makes VoiceOver to read a description of image provided by system on iOS and lets user know this is a button which conveys the message of tappablity
			>
				<View style={ containerStyle }>
					<MediaUploadProgress
						mediaId={ id }
						onUpdateMediaProgress={ this.updateMediaProgress }
						onFinishMediaUploadWithSuccess={
							this.finishMediaUploadWithSuccess
						}
						onFinishMediaUploadWithFailure={
							this.finishMediaUploadWithFailure
						}
						onMediaUploadStateReset={ onRemove }
						renderContent={ this.renderContent }
					/>
				</View>
			</TouchableWithoutFeedback>
		);
	}

	accessibilityLabelImageContainer() {
		const { caption, 'aria-label': ariaLabel } = this.props;

		return isEmpty( caption )
			? ariaLabel
			: ariaLabel +
					'. ' +
					sprintf(
						/* translators: accessibility text. %s: image caption. */
						__( 'Image caption. %s' ),
						caption
					);
	}
}

export default withPreferredColorScheme( GalleryImage );
