/**
 * External dependencies
 */
import { Image, StyleSheet, View, Text, TouchableWithoutFeedback } from 'react-native';
import {
	requestMediaImport,
	mediaUploadSync,
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
} from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BACKSPACE, DELETE } from '@wordpress/keycodes';
import { RichText, MediaUploadProgress } from '@wordpress/block-editor';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Button from './gallery-button';
import styles from './gallery-image-styles';

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
		} else if ( ( this.state.didUploadFail ) || id && ! isURL( url ) ) {
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
			url, alt, id, linkTo, link, isFirstItem, isLastItem, isSelected, caption,
			isBlockSelected, onRemove, onMoveForward, onMoveBackward, setAttributes,
			'aria-label': ariaLabel, isCropped } = this.props;

		// I'm not sure if or how we can use this on mobile
		// eslint-disable-next-line no-unused-vars
		let href;

		switch ( linkTo ) {
			case 'media':
				href = url;
				break;
			case 'attachment':
				href = link;
				break;
		}

		const { isUploadInProgress } = this.state;
		const { isUploadFailed, retryMessage } = params;
		const opacity = isUploadInProgress ? 0.3 : 1;

		return (
			<>
				<Image
					style={ [ styles.image, {
						resizeMode: isCropped ? 'cover' : 'contain',
						opacity,
					} ] }
					source={ { uri: url } }
					// alt={ alt }
					accessibilityLabel={ ariaLabel }
					ref={ this.bindContainer }
				/>
				{ isUploadFailed && (
					<View style={ styles.uploadFailedContainer }>
						<View style={ styles.uploadFailed }>
							<Icon icon={ "warning" } { ...styles.uploadFailedIcon } />
						</View>
						<Text style={ styles.uploadFailedText }>{ retryMessage }</Text>
					</View>
				) }
				<View style={ [ styles.overlay, {
					borderColor: isSelected ? '#0070ff' : '#00000000',
				} ] }>
				{ ! isUploadInProgress && (
					<>
						{ isSelected && (
							<View style={ styles.toolbar }>
								<View style={ styles.moverButtons } >
									<Button
										style={ styles.button }
										icon="arrow-left"
										onClick={ isFirstItem ? undefined : onMoveBackward }
										label={ __( 'Move Image Backward' ) }
										aria-disabled={ isFirstItem }
										disabled={ ! isSelected }
									/>
									<View style={ [ styles.separator, {
										borderRightWidth: StyleSheet.hairlineWidth,
									} ] }></View>
									<Button
										style={ styles.button }
										icon="arrow-right"
										onClick={ isLastItem ? undefined : onMoveForward }
										label={ __( 'Move Image Forward' ) }
										aria-disabled={ isLastItem }
										disabled={ ! isSelected }
									/>
								</View>
								<Button
									style={ styles.removeButton }
									icon="trash"
									onClick={ onRemove }
									label={ __( 'Remove Image' ) }
									disabled={ ! isSelected }
								/>
							</View>
						) }
						{ ! isUploadFailed && ( isSelected || !! caption ) && (
							<View style={ styles.caption } >
								<RichText
									tagName="figcaption"
									placeholder={ isSelected ? __( 'Write caption…' ) : null }
									value={ caption }
									isSelected={ this.state.captionSelected }
									onChange={ ( newCaption ) => setAttributes( { caption: newCaption } ) }
									unstableOnFocus={ this.onSelectCaption }
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
		const { url, id, isBlockSelected, onRemove } = this.props;

		return (
			<TouchableWithoutFeedback
				onPress={ this.onMediaPressed }
				disabled={ ! isBlockSelected }
			>
				<View style={ styles.container }>
					<MediaUploadProgress
						// coverUrl={ url }
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

export default GalleryImage;
