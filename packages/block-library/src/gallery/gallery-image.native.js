/**
 * External dependencies
 */
import { Image, StyleSheet, View, ScrollView, Text, TouchableWithoutFeedback } from 'react-native';
import {
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
} from 'react-native-gutenberg-bridge';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Icon } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Caption, MediaUploadProgress } from '@wordpress/block-editor';
import { isURL } from '@wordpress/url';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Button from './gallery-button';
import style from './gallery-image-style.scss';

const { compose } = StyleSheet;

const separatorStyle = compose( style.separator, { borderRightWidth: StyleSheet.hairlineWidth } );
const buttonStyle = compose( style.button, { aspectRatio: 1 } );
const removeButtonStyle = compose( style.removeButton, { aspectRatio: 1 } );
const ICON_SIZE_ARROW = 15;
const ICON_SIZE_REMOVE = 20;

class GalleryImage extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectImage = this.onSelectImage.bind( this );
		this.onSelectCaption = this.onSelectCaption.bind( this );
		this.onMediaPressed = this.onMediaPressed.bind( this );
		this.onCaptionChange = this.onCaptionChange.bind( this );
		this.bindContainer = this.bindContainer.bind( this );

		this.updateMediaProgress = this.updateMediaProgress.bind( this );
		this.finishMediaUploadWithSuccess = this.finishMediaUploadWithSuccess.bind( this );
		this.finishMediaUploadWithFailure = this.finishMediaUploadWithFailure.bind( this );
		this.renderContent = this.renderContent.bind( this );

		this.state = {
			captionSelected: false,
			isUploadInProgress: false,
			didUploadFail: false,
		};
	}

	bindContainer( ref ) {
		this.container = ref;
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
		const { id, url } = this.props;

		this.onSelectImage();

		if ( this.state.isUploadInProgress ) {
			requestImageUploadCancelDialog( id );
		} else if ( ( this.state.didUploadFail ) || ( id && ! isURL( url ) ) ) {
			requestImageFailedRetryDialog( id );
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

		// unselect the caption so when the user selects other image and comeback
		// the caption is not immediately selected
		if ( this.state.captionSelected && ! isSelected && prevProps.isSelected ) {
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
		this.props.setAttributes( {
			id: payload.mediaServerId,
			url: payload.mediaUrl,
		} );

		this.setState( {
			isUploadInProgress: false,
			didUploadFail: false,
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
			url, isFirstItem, isLastItem, isSelected, caption, onRemove,
			onMoveForward, onMoveBackward, 'aria-label': ariaLabel,
			isCropped, getStylesFromColorScheme } = this.props;

		const { isUploadInProgress, captionSelected } = this.state;
		const { isUploadFailed, retryMessage } = params;
		const resizeMode = isCropped ? 'cover' : 'contain';

		const imageStyle = [ style.image, { resizeMode },
			isUploadInProgress ? style.imageUploading : undefined,
		];

		const overlayStyle = compose( style.overlay,
			isSelected ? style.overlaySelected : undefined,
		);

		const captionPlaceholderStyle = getStylesFromColorScheme( style.captionPlaceholder, style.captionPlaceholderDark );

		const shouldShowCaptionEditable = ! isUploadFailed && isSelected;
		const shouldShowCaptionExpanded = ! isUploadFailed && ( ! isSelected && !! caption );

		const captionContainerStyle = shouldShowCaptionExpanded ?
			style.captionExpandedContainer :
			style.captionContainer;

		const captionStyle = shouldShowCaptionExpanded ?
			style.captionExpanded :
			getStylesFromColorScheme( style.caption, style.captionDark );

		return (
			<>
				<Image
					style={ imageStyle }
					source={ { uri: url } }
					// alt={ alt }
					accessibilityLabel={ ariaLabel }
					ref={ this.bindContainer }
				/>
				{ isUploadFailed && (
					<View style={ style.uploadFailedContainer }>
						<View style={ style.uploadFailed }>
							<Icon icon={ 'warning' } { ...style.uploadFailedIcon } />
						</View>
						<Text style={ style.uploadFailedText }>{ retryMessage }</Text>
					</View>
				) }
				<View style={ overlayStyle }>
					{ ! isUploadInProgress && (
					<>
						{ isSelected && (
							<View style={ style.toolbar }>
								<View style={ style.moverButtonContainer } >
									<Button
										style={ buttonStyle }
										icon="arrow-left-alt"
										iconSize={ ICON_SIZE_ARROW }
										onClick={ isFirstItem ? undefined : onMoveBackward }
										accessibilityLabel={ __( 'Move Image Backward' ) }
										aria-disabled={ isFirstItem }
										disabled={ ! isSelected }
									/>
									<View style={ separatorStyle }></View>
									<Button
										style={ buttonStyle }
										icon="arrow-right-alt"
										iconSize={ ICON_SIZE_ARROW }
										onClick={ isLastItem ? undefined : onMoveForward }
										accessibilityLabel={ __( 'Move Image Forward' ) }
										aria-disabled={ isLastItem }
										disabled={ ! isSelected }
									/>
								</View>
								<Button
									style={ removeButtonStyle }
									icon="no-alt"
									iconSize={ ICON_SIZE_REMOVE }
									onClick={ onRemove }
									accessibilityLabel={ __( 'Remove Image' ) }
									disabled={ ! isSelected }
								/>
							</View>
						) }
						{ ( shouldShowCaptionEditable || shouldShowCaptionExpanded ) && (
							<View style={ captionContainerStyle }>
								<ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
									<Caption
										inlineToolbar
										isSelected={ captionSelected }
										onChange={ this.onCaptionChange }
										onFocus={ this.onSelectCaption }
										placeholder={ isSelected ? __( 'Write caption…' ) : null }
										placeholderTextColor={ captionPlaceholderStyle.color }
										style={ captionStyle }
										value={ caption }
									/>
								</ScrollView>
							</View>
						) }
					</>
					) }
				</View>
			</>
		);
	}

	render() {
		const { id, onRemove, getStylesFromColorScheme, isSelected } = this.props;

		const containerStyle = getStylesFromColorScheme( style.galleryImageContainer,
			style.galleryImageContainerDark );

		return (
			<TouchableWithoutFeedback
				onPress={ this.onMediaPressed }
				accessible={ ! isSelected } // We need only child views to be accessible after the selection
				accessibilityLabel={ this.accessibilityLabelImageContainer() } // if we don't set this explicitly it reads system provided accessibilityLabels of all child components and those include pretty technical words which don't make sense
				accessibilityRole={ 'imagebutton' } // this makes VoiceOver to read a description of image provided by system on iOS and lets user know this is a button which conveys the message of tappablity
			>
				<View style={ containerStyle }>
					<MediaUploadProgress
						mediaId={ id }
						onUpdateMediaProgress={ this.updateMediaProgress }
						onFinishMediaUploadWithSuccess={ this.finishMediaUploadWithSuccess }
						onFinishMediaUploadWithFailure={ this.finishMediaUploadWithFailure }
						onMediaUploadStateReset={ onRemove }
						renderContent={ this.renderContent }
					/>
				</View>
			</TouchableWithoutFeedback>
		);
	}

	accessibilityLabelImageContainer() {
		const { caption, 'aria-label': ariaLabel } = this.props;

		return isEmpty( caption ) ? ariaLabel : ( ariaLabel + '. ' + sprintf(
			/* translators: accessibility text. %s: image caption. */
			__( 'Image caption. %s' ), caption
		) );
	}
}

export default withPreferredColorScheme( GalleryImage );
