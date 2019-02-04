/**
 * External dependencies
 */
import React from 'react';
import { View, ImageBackground, TextInput, Text, TouchableWithoutFeedback } from 'react-native';
import {
	subscribeMediaUpload,
	requestMediaPickFromMediaLibrary,
	requestMediaPickFromDeviceLibrary,
	requestMediaPickFromDeviceCamera,
	mediaUploadSync,
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
} from 'react-native-gutenberg-bridge';

/**
 * Internal dependencies
 */
import { MediaPlaceholder, RichText, BlockControls, InspectorControls, BottomSheet } from '@wordpress/editor';
import { Toolbar, ToolbarButton, Spinner, Dashicon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import ImageSize from './image-size';
import { isURL } from '@wordpress/url';
import styles from './styles.scss';

const MEDIA_UPLOAD_STATE_UPLOADING = 1;
const MEDIA_UPLOAD_STATE_SUCCEEDED = 2;
const MEDIA_UPLOAD_STATE_FAILED = 3;
const MEDIA_UPLOAD_STATE_RESET = 4;

export default class ImageEdit extends React.Component {
	constructor( props ) {
		super( props );

		this.state = {
			showSettings: false,
			showMediaOptions: false,
			progress: 0,
			isUploadInProgress: false,
			isUploadFailed: false,
		};

		this.mediaUpload = this.mediaUpload.bind( this );
		this.addMediaUploadListener = this.addMediaUploadListener.bind( this );
		this.removeMediaUploadListener = this.removeMediaUploadListener.bind( this );
		this.finishMediaUploadWithSuccess = this.finishMediaUploadWithSuccess.bind( this );
		this.finishMediaUploadWithFailure = this.finishMediaUploadWithFailure.bind( this );
		this.onImagePressed = this.onImagePressed.bind( this );
	}

	componentDidMount() {
		const { attributes } = this.props;

		if ( attributes.id && ! isURL( attributes.url ) ) {
			this.addMediaUploadListener();
			mediaUploadSync();
		}
	}

	componentWillUnmount() {
		this.removeMediaUploadListener();
	}

	onImagePressed() {
		const { attributes } = this.props;

		if ( this.state.isUploadInProgress ) {
			requestImageUploadCancelDialog( attributes.id );
		} else if ( attributes.id && ! isURL( attributes.url ) ) {
			requestImageFailedRetryDialog( attributes.id );
		}
	}

	mediaUpload( payload ) {
		const { attributes } = this.props;

		if ( payload.mediaId !== attributes.id ) {
			return;
		}

		switch ( payload.state ) {
			case MEDIA_UPLOAD_STATE_UPLOADING:
				this.setState( { progress: payload.progress, isUploadInProgress: true, isUploadFailed: false } );
				break;
			case MEDIA_UPLOAD_STATE_SUCCEEDED:
				this.finishMediaUploadWithSuccess( payload );
				break;
			case MEDIA_UPLOAD_STATE_FAILED:
				this.finishMediaUploadWithFailure( payload );
				break;
			case MEDIA_UPLOAD_STATE_RESET:
				this.mediaUploadStateReset( payload );
				break;
		}
	}

	finishMediaUploadWithSuccess( payload ) {
		const { setAttributes } = this.props;

		setAttributes( { url: payload.mediaUrl, id: payload.mediaServerId } );
		this.setState( { isUploadInProgress: false } );

		this.removeMediaUploadListener();
	}

	finishMediaUploadWithFailure( payload ) {
		const { setAttributes } = this.props;

		setAttributes( { id: payload.mediaId } );
		this.setState( { isUploadInProgress: false, isUploadFailed: true } );
	}

	mediaUploadStateReset( payload ) {
		const { setAttributes } = this.props;

		setAttributes( { id: payload.mediaId, url: null } );
		this.setState( { isUploadInProgress: false, isUploadFailed: false } );
	}

	addMediaUploadListener() {
		this.subscriptionParentMediaUpload = subscribeMediaUpload( ( payload ) => {
			this.mediaUpload( payload );
		} );
	}

	removeMediaUploadListener() {
		if ( this.subscriptionParentMediaUpload ) {
			this.subscriptionParentMediaUpload.remove();
		}
	}

	render() {
		const { attributes, isSelected, setAttributes } = this.props;
		const { url, caption, height, width } = attributes;

		const onMediaLibraryButtonPressed = () => {
			this.setState( { showMediaOptions: false } );
			requestMediaPickFromMediaLibrary( ( mediaId, mediaUrl ) => {
				if ( mediaUrl ) {
					setAttributes( { id: mediaId, url: mediaUrl } );
				}
			} );
		};

		const onMediaUploadButtonPressed = () => {
			this.setState( { showMediaOptions: false } );
			requestMediaPickFromDeviceLibrary( ( mediaId, mediaUri ) => {
				if ( mediaUri ) {
					this.addMediaUploadListener( );
					setAttributes( { url: mediaUri, id: mediaId } );
				}
			} );
		};

		const onMediaCaptureButtonPressed = () => {
			this.setState( { showMediaOptions: false } );
			requestMediaPickFromDeviceCamera( ( mediaId, mediaUri ) => {
				if ( mediaUri ) {
					this.addMediaUploadListener( );
					setAttributes( { url: mediaUri, id: mediaId } );
				}
			} );
		};

		const onImageSettingsButtonPressed = () => {
			this.setState( { showSettings: true } );
		};

		const onImageSettingsClose = () => {
			this.setState( { showSettings: false } );
		};

		const onMediaOptionsButtonPressed = () => {
			this.setState( { showMediaOptions: true } );
		};

		const onMediaOptionsClose = () => {
			this.setState( { showMediaOptions: false } );
		};

		const toolbarEditButton = (
			<Toolbar>
				<ToolbarButton
					label={ __( 'Edit image' ) }
					icon="edit"
					onClick={ onMediaOptionsButtonPressed }
				/>
			</Toolbar>
		);

		const getInspectorControls = () => (
			<BottomSheet
				isVisible={ this.state.showSettings }
				onClose={ onImageSettingsClose }
				hideHeader
				rightButton={
					<BottomSheet.Button
						text={ __( 'Done' ) }
						color={ '#0087be' }
						onPress={ onImageSettingsClose }
					/>
				}
			>
				<BottomSheet.Cell
					icon={ 'editor-textcolor' }
					label={ __( 'Alt Text' ) }
					value={ __( 'None' ) }
					onPress={ () => {} }
				/>
				<BottomSheet.Cell
					label={ __( 'Reset to original' ) }
					labelStyle={ { color: 'red' } }
					drawSeparator={ false }
					onPress={ () => {} }
				/>
			</BottomSheet>
		);

		const getMediaOptions = () => (
			<BottomSheet
				isVisible={ this.state.showMediaOptions }
				onClose={ onMediaOptionsClose }
				hideHeader
			>
				<BottomSheet.Cell
					label={ __( 'Choose from device' ) }
					labelStyle={ { color: '#00aadc' } }
					onPress={ onMediaUploadButtonPressed }
				/>
				<BottomSheet.Cell
					label={ __( 'Take a Photo' ) }
					labelStyle={ { color: '#00aadc' } }
					onPress={ onMediaCaptureButtonPressed }
				/>
				<BottomSheet.Cell
					label={ __( 'WordPress Media Library' ) }
					labelStyle={ { color: '#00aadc' } }
					onPress={ onMediaLibraryButtonPressed }
				/>
				<BottomSheet.Cell
					label={ __( 'Dismiss' ) }
					labelStyle={ { color: '#00aadc ', fontWeight: 'bold' } }
					drawSeparator={ false }
					onPress={ onMediaOptionsClose }
				/>
			</BottomSheet>
		);

		if ( ! url ) {
			return (
				<View style={ { flex: 1 } } >
					{ getMediaOptions() }
					<MediaPlaceholder
						onMediaOptionsPressed={ onMediaOptionsButtonPressed }
					/>
				</View>
			);
		}

		const showSpinner = this.state.isUploadInProgress;
		const opacity = this.state.isUploadInProgress ? 0.3 : 1;
		const progress = this.state.progress * 100;

		return (
			<TouchableWithoutFeedback onPress={ this.onImagePressed } disabled={ ! isSelected }>
				<View style={ { flex: 1 } }>
					{ showSpinner && <Spinner progress={ progress } /> }
					<BlockControls>
						{ toolbarEditButton }
					</BlockControls>
					<InspectorControls>
						<ToolbarButton
							label={ __( 'Image Settings' ) }
							icon="admin-generic"
							onClick={ onImageSettingsButtonPressed }
						/>
					</InspectorControls>
					<ImageSize src={ url } >
						{ ( sizes ) => {
							const {
								imageWidthWithinContainer,
								imageHeightWithinContainer,
							} = sizes;

							let finalHeight = imageHeightWithinContainer;
							if ( height > 0 && height < imageHeightWithinContainer ) {
								finalHeight = height;
							}

							let finalWidth = imageWidthWithinContainer;
							if ( width > 0 && width < imageWidthWithinContainer ) {
								finalWidth = width;
							}

							return (
								<View style={ { flex: 1 } } >
									{ getInspectorControls() }
									{ getMediaOptions() }
									<ImageBackground
										style={ { width: finalWidth, height: finalHeight, opacity } }
										resizeMethod="scale"
										source={ { uri: url } }
										key={ url }
									>
										{ this.state.isUploadFailed &&
											<View style={ styles.imageContainer } >
												<Dashicon icon={ 'image-rotate' } ariaPressed={ 'dashicon-active' } />
												<Text style={ styles.uploadFailedText }>{ __( 'Failed to insert media.\nPlease tap for options.' ) }</Text>
											</View>
										}
									</ImageBackground>
								</View>
							);
						} }
					</ImageSize>
					{ ( ! RichText.isEmpty( caption ) > 0 || isSelected ) && (
						<View style={ { padding: 12, flex: 1 } }>
							<TextInput
								style={ { textAlign: 'center' } }
								underlineColorAndroid="transparent"
								value={ caption }
								placeholder={ __( 'Write caption…' ) }
								onChangeText={ ( newCaption ) => setAttributes( { caption: newCaption } ) }
							/>
						</View>
					) }
				</View>
			</TouchableWithoutFeedback>
		);
	}
}
