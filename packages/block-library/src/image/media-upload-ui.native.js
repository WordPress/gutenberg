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
 * WordPress dependencies
 */
import {
	Toolbar,
	ToolbarButton,
	Spinner,
	Dashicon,
} from '@wordpress/components';
import {
	MediaPlaceholder,
	RichText,
	BlockControls,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	BottomSheet,
	Picker,
} from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import ImageSize from './image-size';
import styles from './styles.scss';

const MEDIA_UPLOAD_STATE_UPLOADING = 1;
const MEDIA_UPLOAD_STATE_SUCCEEDED = 2;
const MEDIA_UPLOAD_STATE_FAILED = 3;
const MEDIA_UPLOAD_STATE_RESET = 4;

class MediaUploadUI extends React.Component {
	constructor( props ) {
		super( props );

		this.state = {
			progress: 0,
			isUploadInProgress: false,
			isUploadFailed: false,
			mediaId: null,
		};

		this.mediaUpload = this.mediaUpload.bind( this );
	/*	this.finishMediaUploadWithSuccess = this.finishMediaUploadWithSuccess.bind( this );
		this.finishMediaUploadWithFailure = this.finishMediaUploadWithFailure.bind( this );
		this.updateMediaProgress = this.updateMediaProgress.bind( this );*/
	}

	componentDidMount() {
		this.addMediaUploadListener();
	}

	componentWillUnmount() {
		this.removeMediaUploadListener();
	}

	mediaUpload( payload ) {
		const { mediaId } = this.state;

		if ( payload.mediaId !== mediaId ) {
			return;
		}

		switch ( payload.state ) {
			case MEDIA_UPLOAD_STATE_UPLOADING:
				this.updateMediaProgress( payload );
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

	updateMediaProgress( payload ) {
		//const { setAttributes } = this.props;
		this.setState( { progress: payload.progress, isUploadInProgress: true, isUploadFailed: false } );
		this.props.onUpdateMediaProgress( payload );
		//if ( payload.mediaUrl ) {
			//	setAttributes( { url: payload.mediaUrl } );
		//}
	}

	finishMediaUploadWithSuccess( payload ) {
		//const { setAttributes } = this.props;

		//setAttributes( { url: payload.mediaUrl, id: payload.mediaServerId } );
		this.props.onFinishMediaUploadWithSuccess( payload );
		this.setState( { isUploadInProgress: false, mediaId: payload.mediaServerId } );
	}

	finishMediaUploadWithFailure( payload ) {
		//const { setAttributes } = this.props;

		//setAttributes( { id: payload.mediaId } );
		this.props.onFinishMediaUploadWithFailure( payload );
		this.setState( { isUploadInProgress: false, isUploadFailed: true, mediaId: payload.mediaId  } );
	}

	mediaUploadStateReset( payload ) {
		//const { setAttributes } = this.props;

		//setAttributes( { id: payload.mediaId, url: null } );
		this.props.onMediaUploadStateReset( payload );
		this.setState( { isUploadInProgress: false, isUploadFailed: false, mediaId: null } );
	}

	addMediaUploadListener() {
		//if we already have a subscription not worth doing it again
		if ( this.subscriptionParentMediaUpload ) {
			return;
		}
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
		const { coverUrl, height, width } = this.props;

		const showSpinner = this.state.isUploadInProgress;
		const opacity = this.state.isUploadInProgress ? 0.3 : 1;
		const progress = this.state.progress * 100;

		return (
			<View style={ { flex: 1 } }>
				{ showSpinner && <Spinner progress={ progress } /> }
				<ImageSize src={ coverUrl } >
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
								{/* { getInspectorControls() }
								{ getMediaOptions() } */}

								{ ! imageWidthWithinContainer && <View style={ styles.imageContainer } >
									<Dashicon icon={ 'format-image' } size={ 300 } />
								</View> }
								<ImageBackground
									style={ { width: finalWidth, height: finalHeight, opacity } }
									resizeMethod="scale"
									source={ { uri: coverUrl } }
									key={ coverUrl }
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
			</View>
		);

	}
}

export default MediaUploadUI;