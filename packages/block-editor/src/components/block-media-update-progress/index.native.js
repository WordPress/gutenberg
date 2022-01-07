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
	subscribeMediaSave,
} from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

export const MEDIA_UPLOAD_STATE_UPLOADING = 1;
export const MEDIA_UPLOAD_STATE_SUCCEEDED = 2;
export const MEDIA_UPLOAD_STATE_FAILED = 3;
export const MEDIA_UPLOAD_STATE_RESET = 4;

export const MEDIA_SAVE_STATE_SAVING = 5;
export const MEDIA_SAVE_STATE_SUCCEEDED = 6;
export const MEDIA_SAVE_STATE_FAILED = 7;
export const MEDIA_SAVE_STATE_RESET = 8;
export const MEDIA_SAVE_FINAL_STATE_RESULT = 9;
export const MEDIA_SAVE_MEDIAID_CHANGED = 10;

export class BlockMediaUpdateProgress extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			progress: 0,
			isSaveInProgress: false,
			isSaveFailed: false,
			isUploadInProgress: false,
			isUploadFailed: false,
		};

		this.mediaUpload = this.mediaUpload.bind( this );
		this.mediaSave = this.mediaSave.bind( this );
	}

	componentDidMount() {
		this.addMediaUploadListener();
		this.addMediaSaveListener();
	}

	componentWillUnmount() {
		this.removeMediaUploadListener();
		this.removeMediaSaveListener();
	}

	mediaIdContainedInMediaFiles( mediaId, mediaFiles ) {
		if ( mediaId !== undefined && mediaFiles !== undefined ) {
			return mediaFiles.some(
				( element ) => element.id === mediaId.toString()
			);
		}
		return false;
	}

	mediaUpload( payload ) {
		const { mediaFiles } = this.props;

		if (
			this.mediaIdContainedInMediaFiles( payload.mediaId, mediaFiles ) ===
			false
		) {
			return;
		}

		switch ( payload.state ) {
			case MEDIA_UPLOAD_STATE_UPLOADING:
				this.updateMediaUploadProgress( payload );
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

	mediaSave( payload ) {
		const { mediaFiles } = this.props;

		if (
			this.mediaIdContainedInMediaFiles( payload.mediaId, mediaFiles ) ===
			false
		) {
			return;
		}

		switch ( payload.state ) {
			case MEDIA_SAVE_STATE_SAVING:
				this.updateMediaSaveProgress( payload );
				break;
			case MEDIA_SAVE_STATE_SUCCEEDED:
				this.finishMediaSaveWithSuccess( payload );
				break;
			case MEDIA_SAVE_STATE_FAILED:
				this.finishMediaSaveWithFailure( payload );
				break;
			case MEDIA_SAVE_STATE_RESET:
				this.mediaSaveStateReset( payload );
				break;
			case MEDIA_SAVE_FINAL_STATE_RESULT:
				this.finalSaveResult( payload );
				break;
			case MEDIA_SAVE_MEDIAID_CHANGED:
				this.mediaIdChanged( payload );
				break;
		}
	}

	// ---- Block media save actions
	updateMediaSaveProgress( payload ) {
		this.setState( {
			progress: payload.progress,
			isUploadInProgress: false,
			isUploadFailed: false,
			isSaveInProgress: true,
			isSaveFailed: false,
		} );
		if ( this.props.onUpdateMediaSaveProgress ) {
			this.props.onUpdateMediaSaveProgress( payload );
		}
	}

	finishMediaSaveWithSuccess( payload ) {
		this.setState( { isSaveInProgress: false } );
		if ( this.props.onFinishMediaSaveWithSuccess ) {
			this.props.onFinishMediaSaveWithSuccess( payload );
		}
	}

	finishMediaSaveWithFailure( payload ) {
		this.setState( { isSaveInProgress: false, isSaveFailed: true } );
		if ( this.props.onFinishMediaSaveWithFailure ) {
			this.props.onFinishMediaSaveWithFailure( payload );
		}
	}

	mediaSaveStateReset( payload ) {
		this.setState( { isSaveInProgress: false, isSaveFailed: false } );
		if ( this.props.onMediaSaveStateReset ) {
			this.props.onMediaSaveStateReset( payload );
		}
	}

	finalSaveResult( payload ) {
		this.setState( {
			progress: payload.progress,
			isUploadInProgress: false,
			isUploadFailed: false,
			isSaveInProgress: false,
			isSaveFailed: ! payload.success,
		} );
		if ( this.props.onFinalSaveResult ) {
			this.props.onFinalSaveResult( payload );
		}
	}

	mediaIdChanged( payload ) {
		this.setState( {
			isUploadInProgress: false,
			isUploadFailed: false,
			isSaveInProgress: false,
			isSaveFailed: false,
		} );
		if ( this.props.onMediaIdChanged ) {
			this.props.onMediaIdChanged( payload );
		}
	}

	// ---- Block media upload actions
	updateMediaUploadProgress( payload ) {
		this.setState( {
			progress: payload.progress,
			isUploadInProgress: true,
			isUploadFailed: false,
			isSaveInProgress: false,
			isSaveFailed: false,
		} );
		if ( this.props.onUpdateMediaUploadProgress ) {
			this.props.onUpdateMediaUploadProgress( payload );
		}
	}

	finishMediaUploadWithSuccess( payload ) {
		this.setState( { isUploadInProgress: false, isSaveInProgress: false } );
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
		//if we already have a subscription not worth doing it again
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

	addMediaSaveListener() {
		//if we already have a subscription not worth doing it again
		if ( this.subscriptionParentMediaSave ) {
			return;
		}
		this.subscriptionParentMediaSave = subscribeMediaSave( ( payload ) => {
			this.mediaSave( payload );
		} );
	}

	removeMediaSaveListener() {
		if ( this.subscriptionParentMediaSave ) {
			this.subscriptionParentMediaSave.remove();
		}
	}

	render() {
		const { renderContent = () => null } = this.props;
		const {
			isUploadInProgress,
			isUploadFailed,
			isSaveInProgress,
			isSaveFailed,
		} = this.state;
		const showSpinner =
			this.state.isUploadInProgress || this.state.isSaveInProgress;
		const progress = this.state.progress * 100;
		// eslint-disable-next-line @wordpress/i18n-no-collapsible-whitespace
		const retryMessageSave = __(
			'Failed to save files.\nPlease tap for options.'
		);
		// eslint-disable-next-line @wordpress/i18n-no-collapsible-whitespace
		const retryMessageUpload = __(
			'Failed to upload files.\nPlease tap for options.'
		);
		let retryMessage = retryMessageSave;
		if ( isUploadFailed ) {
			retryMessage = retryMessageUpload;
		}

		return (
			<View style={ styles.mediaUploadProgress } pointerEvents="box-none">
				{ showSpinner && (
					<View style={ styles.progressBar }>
						<Spinner progress={ progress } testID="spinner" />
					</View>
				) }
				{ renderContent( {
					isUploadInProgress,
					isUploadFailed,
					isSaveInProgress,
					isSaveFailed,
					retryMessage,
				} ) }
			</View>
		);
	}
}

export default BlockMediaUpdateProgress;
