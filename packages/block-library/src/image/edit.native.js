/**
 * External dependencies
 */
import React from 'react';
import { View, Image, TextInput, TouchableWithoutFeedback } from 'react-native';
import {
	subscribeMediaUpload,
	requestMediaPickFromMediaLibrary,
	requestMediaPickFromDeviceLibrary,
	requestMediaPickFromDeviceCamera,
	mediaUploadSync,
	onImageFailedRetry,
} from 'react-native-gutenberg-bridge';

/**
 * Internal dependencies
 */
import { MediaPlaceholder, RichText, BlockControls } from '@wordpress/editor';
import { Toolbar, ToolbarButton, Spinner, Dashicon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import ImageSize from './image-size';
import { isURL } from '@wordpress/url';

const MEDIA_ULOAD_STATE_UPLOADING = 1;
const MEDIA_ULOAD_STATE_SUCCEEDED = 2;
const MEDIA_ULOAD_STATE_FAILED = 3;

export default class ImageEdit extends React.Component {
	constructor( props ) {
		super( props );

		this.state = {
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
		debugger;

		// TODO here check whether image is failed. If it is, then call onImageFailedRetry
		// if it is not, then call onImageUploadCancel
		if ( this.state.isUploadInProgress ) {
			// TODO call onImageUploadCancel
		} else if ( attributes.id && ! isURL( attributes.url ) ) {
			onImageFailedRetry( attributes.id );
		}
	}

	mediaUpload( payload ) {
		const { attributes } = this.props;

		if ( payload.mediaId !== attributes.id ) {
			return;
		}

		switch ( payload.state ) {
			case MEDIA_ULOAD_STATE_UPLOADING:
				this.setState( { progress: payload.progress, isUploadInProgress: true, isUploadFailed: false } );
				break;
			case MEDIA_ULOAD_STATE_SUCCEEDED:
				this.finishMediaUploadWithSuccess( payload );
				break;
			case MEDIA_ULOAD_STATE_FAILED:
				this.finishMediaUploadWithFailure( payload );
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

		setAttributes( { url: payload.mediaUrl, id: payload.mediaId } );
		this.setState( { isUploadInProgress: false, isUploadFailed: true } );
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
			requestMediaPickFromMediaLibrary( ( mediaId, mediaUrl ) => {
				if ( mediaUrl ) {
					setAttributes( { id: mediaId, url: mediaUrl } );
				}
			} );
		};

		if ( ! url ) {
			const onMediaUploadButtonPressed = () => {
				requestMediaPickFromDeviceLibrary( ( mediaId, mediaUri ) => {
					if ( mediaUri ) {
						this.addMediaUploadListener( );
						setAttributes( { url: mediaUri, id: mediaId } );
					}
				} );
			};

			const onMediaCaptureButtonPressed = () => {
				requestMediaPickFromDeviceCamera( ( mediaId, mediaUri ) => {
					if ( mediaUri ) {
						this.addMediaUploadListener( );
						setAttributes( { url: mediaUri, id: mediaId } );
					}
				} );
			};

			return (
				<MediaPlaceholder
					onUploadMediaPressed={ onMediaUploadButtonPressed }
					onMediaLibraryPressed={ onMediaLibraryButtonPressed }
					onCapturePhotoPressed={ onMediaCaptureButtonPressed }
				/>
			);
		}

		const toolbarEditButton = (
			<Toolbar>
				<ToolbarButton
					label={ __( 'Edit image' ) }
					icon="edit"
					onClick={ onMediaLibraryButtonPressed }
				/>
			</Toolbar>
		);

		const showSpinner = this.state.isUploadInProgress;
		const opacity = this.state.isUploadInProgress ? 0.3 : 1;
		const progress = this.state.progress * 100;

		return (
			<TouchableWithoutFeedback onPress={ this.onImagePressed } >
				<View style={ { flex: 1 } }>
					{ showSpinner && <Spinner progress={ progress } /> }
					<BlockControls>
						{ toolbarEditButton }
					</BlockControls>
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
								<View style={ { flex: 1, justifyContent: 'center', alignItems: 'center' } } >
									<Image
										style={ { width: finalWidth, height: finalHeight, opacity } }
										resizeMethod="scale"
										source={ { uri: url } }
										key={ url }
									/>
									{this.state.isUploadFailed && <View style={ { position: 'absolute', flexDirection: 'column', alignItems: 'center'} }>
										<Dashicon icon={ 'arrow-down-alt' }/>
										<Text style={ { color: 'white', fontSize: 14, marginTop: 5 } }>{ __( 'Failed to insert media.Please tap for options.' ) }</Text>
									</View>}
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
