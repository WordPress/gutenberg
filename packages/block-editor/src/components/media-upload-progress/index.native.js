/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	subscribeMediaUpload,
	requestImageUploadCancel,
} from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import {
	MEDIA_UPLOAD_STATE_IDLE,
	MEDIA_UPLOAD_STATE_UPLOADING,
	MEDIA_UPLOAD_STATE_SUCCEEDED,
	MEDIA_UPLOAD_STATE_FAILED,
	MEDIA_UPLOAD_STATE_RESET,
	MEDIA_UPLOAD_STATE_PAUSED,
} from './constants';

export class MediaUploadProgress extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			uploadState: MEDIA_UPLOAD_STATE_IDLE,
			progress: 0,
			isUploadInProgress: false,
			isUploadFailed: false,
		};

		this.mediaUpload = this.mediaUpload.bind( this );
		this.getRetryMessage = this.getRetryMessage.bind( this );
	}

	componentDidMount() {
		this.addMediaUploadListener();
	}

	componentWillUnmount() {
		const { isUploadInProgress, isUploadFailed } = this.state;
		const { mediaId } = this.props;

		if ( isUploadInProgress || isUploadFailed ) {
			requestImageUploadCancel( mediaId );
		}
		this.removeMediaUploadListener();
	}

	mediaUpload( payload ) {
		const { mediaId } = this.props;
		if (
			payload.mediaId !== mediaId ||
			( payload.state === this.state.uploadState &&
				payload.progress === this.state.progress )
		) {
			return;
		}

		if ( payload?.mediaUrl && ! payload.state ) {
			this.updateMediaThumbnail( payload );
			return;
		}

		switch ( payload.state ) {
			case MEDIA_UPLOAD_STATE_UPLOADING:
				this.updateMediaProgress( payload );
				break;
			case MEDIA_UPLOAD_STATE_SUCCEEDED:
				this.finishMediaUploadWithSuccess( payload );
				break;
			case MEDIA_UPLOAD_STATE_PAUSED:
				this.finishMediaUploadWithPause( payload );
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
		this.setState( {
			progress: payload.progress,
			uploadState: payload.state,
			isUploadInProgress: true,
			isUploadFailed: false,
		} );
		if ( this.props.onUpdateMediaProgress ) {
			this.props.onUpdateMediaProgress( payload );
		}
	}

	updateMediaThumbnail( payload ) {
		const { onUpdateMediaProgress } = this.props;
		if ( onUpdateMediaProgress ) {
			onUpdateMediaProgress( payload );
		}
	}

	finishMediaUploadWithSuccess( payload ) {
		this.setState( {
			uploadState: payload.state,
			isUploadInProgress: false,
		} );
		if ( this.props.onFinishMediaUploadWithSuccess ) {
			this.props.onFinishMediaUploadWithSuccess( payload );
		}
	}

	finishMediaUploadWithPause( payload ) {
		if ( ! this.props.enablePausedUploads ) {
			this.finishMediaUploadWithFailure( payload );
			return;
		}

		this.setState( {
			uploadState: payload.state,
			isUploadInProgress: true,
			isUploadFailed: false,
		} );
		if ( this.props.onFinishMediaUploadWithFailure ) {
			this.props.onFinishMediaUploadWithFailure( payload );
		}
	}

	finishMediaUploadWithFailure( payload ) {
		this.setState( {
			uploadState: payload.state,
			isUploadInProgress: false,
			isUploadFailed: true,
		} );
		if ( this.props.onFinishMediaUploadWithFailure ) {
			this.props.onFinishMediaUploadWithFailure( payload );
		}
	}

	mediaUploadStateReset( payload ) {
		this.setState( {
			uploadState: payload.state,
			isUploadInProgress: false,
			isUploadFailed: false,
		} );
		if ( this.props.onMediaUploadStateReset ) {
			this.props.onMediaUploadStateReset( payload );
		}
	}

	addMediaUploadListener() {
		// If we already have a subscription not worth doing it again.
		if ( this.subscriptionParentMediaUpload ) {
			return;
		}
		this.subscriptionParentMediaUpload = subscribeMediaUpload(
			( payload ) => {
				this.mediaUpload( payload );
			}
		);
	}

	removeMediaUploadListener() {
		if ( this.subscriptionParentMediaUpload ) {
			this.subscriptionParentMediaUpload.remove();
		}
	}

	getRetryMessage() {
		if (
			this.state.uploadState === MEDIA_UPLOAD_STATE_PAUSED &&
			this.props.enablePausedUploads
		) {
			return __( 'Waiting for connection' );
		}

		// eslint-disable-next-line @wordpress/i18n-no-collapsible-whitespace
		return __( 'Failed to insert media.\nTap for more info.' );
	}

	render() {
		const { renderContent = () => null } = this.props;
		const { isUploadInProgress, isUploadFailed, uploadState } = this.state;
		const showSpinner = this.state.isUploadInProgress;
		const progress = this.state.progress * 100;
		const retryMessage = this.getRetryMessage();

		const progressBarStyle = [
			styles.progressBar,
			showSpinner || styles.progressBarHidden,
			this.props.progressBarStyle,
		];

		return (
			<View
				style={ [
					styles.mediaUploadProgress,
					this.props.containerStyle,
				] }
				pointerEvents="box-none"
			>
				<View style={ progressBarStyle }>
					{ showSpinner && (
						<Spinner
							progress={ progress }
							style={ this.props.spinnerStyle }
							testID="spinner"
						/>
					) }
				</View>
				{ renderContent( {
					isUploadPaused:
						uploadState === MEDIA_UPLOAD_STATE_PAUSED &&
						this.props.enablePausedUploads,
					isUploadInProgress,
					isUploadFailed,
					retryMessage,
				} ) }
			</View>
		);
	}
}

export default MediaUploadProgress;
