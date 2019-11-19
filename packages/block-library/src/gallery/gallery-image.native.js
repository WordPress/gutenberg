/**
 * External dependencies
 */
import { Image, StyleSheet, View, ScrollView, Text, TouchableWithoutFeedback } from 'react-native';
import {
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
} from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { RichText, MediaUploadProgress } from '@wordpress/block-editor';
import { isURL } from '@wordpress/url';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Button from './gallery-button';
import style from './gallery-image-style';

const { compose } = StyleSheet;

const separatorStyle = compose( style.separator,
	{ borderRightWidth: StyleSheet.hairlineWidth }
);

const buttonStyle = compose( style.button,
	{ aspectRatio: 1 }
);

const removeButtonStyle = compose( style.removeButton,
	{ aspectRatio: 1 }
);

class GalleryImage extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectImage = this.onSelectImage.bind( this );
		this.onSelectCaption = this.onSelectCaption.bind( this );
		this.onMediaPressed = this.onMediaPressed.bind( this );
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
		if ( ! this.props.isSelected ) {
			this.props.onSelect();
		}

		if ( this.state.captionSelected ) {
			this.setState( {
				captionSelected: false,
			} );
		}
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
			onMoveForward, onMoveBackward, setAttributes, 'aria-label': ariaLabel,
			isCropped, getStylesFromColorScheme } = this.props;


		const { isUploadInProgress } = this.state;
		const { isUploadFailed, retryMessage } = params;
		const resizeMode = isCropped ? 'cover' : 'contain';

		const imageStyle = [ style.image, { resizeMode },
			isUploadInProgress ? style.imageUploading : undefined,
		];

		const overlayStyle = compose( style.overlay,
			isSelected ? style.overlaySelected : undefined,
		);

		const captionStyle = getStylesFromColorScheme( style.caption, style.captionDark );
		const captionPlaceholderStyle = getStylesFromColorScheme( style.captionPlaceholder, style.captionPlaceholderDark );

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
										icon="arrow-left"
										onClick={ isFirstItem ? undefined : onMoveBackward }
										accessibilityLabel={ __( 'Move Image Backward' ) }
										aria-disabled={ isFirstItem }
										disabled={ ! isSelected }
									/>
									<View style={ separatorStyle }></View>
									<Button
										style={ buttonStyle }
										icon="arrow-right"
										onClick={ isLastItem ? undefined : onMoveForward }
										accessibilityLabel={ __( 'Move Image Forward' ) }
										aria-disabled={ isLastItem }
										disabled={ ! isSelected }
									/>
								</View>
								<Button
									style={ removeButtonStyle }
									icon="trash"
									onClick={ onRemove }
									accessibilityLabel={ __( 'Remove Image' ) }
									disabled={ ! isSelected }
								/>
							</View>
						) }
						{ ! isUploadFailed && ( isSelected || !! caption ) && (
							<View style={ styles.captionContainer } >
								<RichText
									tagName="figcaption"
									placeholder={ isSelected ? __( 'Write caption…' ) : null }
									value={ caption }
									isSelected={ this.state.captionSelected }
									onChange={ ( newCaption ) => setAttributes( { caption: newCaption } ) }
									unstableOnFocus={ this.onSelectCaption }
									// fontSize={ 36 }
									style={ captionStyle }
									placeholderStyle={ captionPlaceholderStyle }
									inlineToolbar
								/>
							</View>
						) }
					</>
					) }
				</View>
			</>
		);
	}

	render() {
		const { id, isBlockSelected, onRemove, getStylesFromColorScheme } = this.props;

		const containerStyle = getStylesFromColorScheme( style.galleryImageContainer,
			style.galleryImageContainerDark );

		return (
			<TouchableWithoutFeedback
				onPress={ this.onMediaPressed }
				disabled={ ! isBlockSelected }
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
}

export default withPreferredColorScheme( GalleryImage );
