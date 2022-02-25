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
import { subscribeMediaUpload } from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

export const MEDIA_UPLOAD_STATE_UPLOADING = 1;
export const MEDIA_UPLOAD_STATE_SUCCEEDED = 2;
export const MEDIA_UPLOAD_STATE_FAILED = 3;
export const MEDIA_UPLOAD_STATE_RESET = 4;

export class MediaUploadProgress extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			progress: 0,
			isUploadInProgress: false,
			isUploadFailed: false,
		};

		this.mediaUpload = this.mediaUpload.bind( this );
	}

	componentDidMount() {
		this.addMediaUploadListener();
	}

	componentWillUnmount() {
		this.removeMediaUploadListener();
	}

	mediaUpload( payload ) {
		const { mediaId } = this.props;

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
		this.setState( {
			progress: payload.progress,
			isUploadInProgress: true,
			isUploadFailed: false,
		} );
		if ( this.props.onUpdateMediaProgress ) {
			this.props.onUpdateMediaProgress( payload );
		}
	}

	finishMediaUploadWithSuccess( payload ) {
		this.setState( { isUploadInProgress: false } );
		if ( this.props.onFinishMediaUploadWithSuccess ) {
			this.props.onFinishMediaUploadWithSuccess( payload );
		}
	}

	finishMediaUploadWithFailure( payload ) {
		this.setState( { isUploadInProgress: false, isUploadFailed: true } );
		if ( this.props.onFinishMediaUploadWithFailure ) {
			this.props.onFinishMediaUploadWithFailure( payload );
		}
	}

	mediaUploadStateReset( payload ) {
		this.setState( { isUploadInProgress: false, isUploadFailed: false } );
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

	render() {
		const { renderContent = () => null } = this.props;
		const { isUploadInProgress, isUploadFailed } = this.state;
		const showSpinner = this.state.isUploadInProgress;
		const progress = this.state.progress * 100;
		// eslint-disable-next-line @wordpress/i18n-no-collapsible-whitespace
		const retryMessage = __(
			'Failed to insert media.\nPlease tap for options.'
		);

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
					isUploadInProgress,
					isUploadFailed,
					retryMessage,
				} ) }
			</View>
		);
	}
}

export default MediaUploadProgress;
