/**
 * External dependencies
 */
import React from 'react';
import { View } from 'react-native';
import {
	subscribeMediaUpload,
} from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import {
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

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
		this.setState( { progress: payload.progress, isUploadInProgress: true, isUploadFailed: false } );
		this.props.onUpdateMediaProgress( payload );
	}

	finishMediaUploadWithSuccess( payload ) {
		this.setState( { isUploadInProgress: false, mediaId: payload.mediaServerId } );
		this.props.onFinishMediaUploadWithSuccess( payload );
	}

	finishMediaUploadWithFailure( payload ) {
		this.setState( { isUploadInProgress: false, isUploadFailed: true, mediaId: payload.mediaId } );
		this.props.onFinishMediaUploadWithFailure( payload );
	}

	mediaUploadStateReset( payload ) {
		this.setState( { isUploadInProgress: false, isUploadFailed: false, mediaId: null } );
		this.props.onMediaUploadStateReset( payload );
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
		const showSpinner = this.state.isUploadInProgress;
		const progress = this.state.progress * 100;

		return (
			<View style={ { flex: 1 } }>
				{ showSpinner && <Spinner progress={ progress } /> }
				{ this.props.renderContent( this.state.isUploadInProgress ) }
			</View>
		);
	}
}

export default MediaUploadUI;
