/**
 * External dependencies
 */
import { ActivityIndicator, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/components';
import { subscribeMediaUpload } from '@wordpress/react-native-bridge';
import { offline as offlineIcon } from '@wordpress/icons';

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

const MediaUploadProgress = ( props ) => {
	const [ uploadState, setUploadState ] = useState( MEDIA_UPLOAD_STATE_IDLE );
	const [ progress, setProgress ] = useState( 0 );
	const [ isUploadInProgress, setIsUploadInProgress ] = useState( false );
	const [ isUploadFailed, setIsUploadFailed ] = useState( false );

	const mediaUpload = ( payload ) => {
		const { mediaId } = props;

		if (
			payload.mediaId !== mediaId ||
			( payload.state === uploadState && payload.progress === progress )
		) {
			return;
		}

		switch ( payload.state ) {
			case MEDIA_UPLOAD_STATE_UPLOADING:
				updateMediaProgress( payload );
				break;
			case MEDIA_UPLOAD_STATE_SUCCEEDED:
				finishMediaUploadWithSuccess( payload );
				break;
			case MEDIA_UPLOAD_STATE_PAUSED:
				finishMediaUploadWithPause( payload );
				break;
			case MEDIA_UPLOAD_STATE_FAILED:
				finishMediaUploadWithFailure( payload );
				break;
			case MEDIA_UPLOAD_STATE_RESET:
				mediaUploadStateReset( payload );
				break;
		}
	};

	const updateMediaProgress = ( payload ) => {
		setProgress( payload.progress );
		setUploadState( payload.state );
		setIsUploadInProgress( true );
		setIsUploadFailed( false );
		if ( props.onUpdateMediaProgress ) {
			props.onUpdateMediaProgress( payload );
		}
	};

	const finishMediaUploadWithSuccess = ( payload ) => {
		setUploadState( payload.state );
		setIsUploadInProgress( false );
		if ( props.onFinishMediaUploadWithSuccess ) {
			props.onFinishMediaUploadWithSuccess( payload );
		}
	};

	const finishMediaUploadWithPause = ( payload ) => {
		if ( ! props.enablePausedUploads ) {
			finishMediaUploadWithFailure( payload );
			return;
		}

		setUploadState( payload.state );
		setIsUploadInProgress( true );
		setIsUploadFailed( false );
		if ( props.onFinishMediaUploadWithPause ) {
			props.onFinishMediaUploadWithPause( payload );
		}
	};

	const finishMediaUploadWithFailure = ( payload ) => {
		setUploadState( payload.state );
		setIsUploadInProgress( false );
		setIsUploadFailed( true );
		if ( props.onFinishMediaUploadWithFailure ) {
			props.onFinishMediaUploadWithFailure( payload );
		}
	};

	const mediaUploadStateReset = ( payload ) => {
		setUploadState( payload.state );
		setIsUploadInProgress( false );
		setIsUploadFailed( false );
		if ( props.onMediaUploadStateReset ) {
			props.onMediaUploadStateReset( payload );
		}
	};

	useEffect( () => {
		const subscription = subscribeMediaUpload( ( payload ) => {
			mediaUpload( payload );
		} );

		return () => subscription.remove();
	}, [ mediaUpload ] );

	const getRetryMessage = () => {
		if (
			uploadState === MEDIA_UPLOAD_STATE_PAUSED &&
			props.enablePausedUploads
		) {
			return;
		}

		// eslint-disable-next-line @wordpress/i18n-no-collapsible-whitespace
		return __( 'Failed to insert media.\nTap for more info.' );
	};

	const retryMessage = getRetryMessage();
	const isUploadPaused =
		uploadState === MEDIA_UPLOAD_STATE_PAUSED && props.enablePausedUploads;
	const showProgress =
		isUploadInProgress && ! isUploadPaused && ! isUploadFailed;
	const { renderContent = () => null } = props;

	const indicatorContainerStyle = usePreferredColorSchemeStyle(
		styles.indicator__container,
		styles[ 'indicator__container--dark' ]
	);

	const indicatorIconStyle = usePreferredColorSchemeStyle(
		styles.indicator__icon,
		styles[ 'indicator__icon--dark' ]
	);

	return (
		<View
			style={ [ styles.mediaUploadProgress, props.containerStyle ] }
			pointerEvents="box-none"
			testID="progress-container"
		>
			{ isUploadPaused && (
				<View style={ indicatorContainerStyle }>
					<Icon
						fill="#111"
						size="20"
						icon={ offlineIcon }
						style={ indicatorIconStyle }
					/>
				</View>
			) }
			{ showProgress && (
				<>
					{ props.progressType &&
					props.progressType === 'determinate' &&
					progress !== 100 ? (
						<View style={ styles.progress }>
							<View
								style={ [
									styles.progress__bar,
									{ width: `${ progress }%` },
								] }
							/>
						</View>
					) : (
						<View style={ indicatorContainerStyle }>
							<ActivityIndicator
								style={ indicatorIconStyle }
								size={ 20 }
								color="#111"
							/>
						</View>
					) }
				</>
			) }
			{ renderContent( {
				isUploadPaused,
				isUploadInProgress,
				isUploadFailed,
				retryMessage,
			} ) }
		</View>
	);
};

export default MediaUploadProgress;
