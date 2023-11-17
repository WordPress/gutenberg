/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
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

// eslint-disable-next-line @wordpress/i18n-no-collapsible-whitespace
const retryMessage = __( 'Failed to insert media.\nTap for more info.' );

export function MediaUploadProgress( props ) {
	const [ progress, setProgress ] = useState( 0 );
	const [ isUploadInProgress, setIsUploadInProgress ] = useState( false );
	const [ isUploadFailed, setIsUploadFailed ] = useState( false );
	const [ subscriptionParentMediaUpload, setSubscriptionParentMediaUpload ] =
		useState( null );
	const [ progressBarStyle, setProgressBarStyle ] = useState( [] );

	const { renderContent = () => null } = props;

	const mediaUpload = useCallback(
		( payload ) => {
			const { mediaId } = props;

			if ( payload.mediaId !== mediaId ) {
				return;
			}

			switch ( payload.state ) {
				case MEDIA_UPLOAD_STATE_UPLOADING:
					updateMediaProgress( payload );
					break;
				case MEDIA_UPLOAD_STATE_SUCCEEDED:
					finishMediaUploadWithSuccess( payload );
					break;
				case MEDIA_UPLOAD_STATE_FAILED:
					finishMediaUploadWithFailure( payload );
					break;
				case MEDIA_UPLOAD_STATE_RESET:
					mediaUploadStateReset( payload );
					break;
			}
		},
		[
			props,
			updateMediaProgress,
			finishMediaUploadWithSuccess,
			finishMediaUploadWithFailure,
			mediaUploadStateReset,
		]
	);

	const updateMediaProgress = useCallback(
		( payload ) => {
			setProgress( payload.progress );
			setIsUploadInProgress( true );
			setIsUploadFailed( false );

			if ( props.onUpdateMediaProgress ) {
				props.onUpdateMediaProgress( payload );
			}
		},
		[ props.onUpdateMediaProgress ]
	);

	const finishMediaUploadWithSuccess = useCallback(
		( payload ) => {
			setIsUploadInProgress( false );
			if ( props.onFinishMediaUploadWithSuccess ) {
				props.onFinishMediaUploadWithSuccess( payload );
			}
		},
		[ props.onFinishMediaUploadWithSuccess ]
	);

	const finishMediaUploadWithFailure = useCallback(
		( payload ) => {
			setIsUploadInProgress( false );
			setIsUploadFailed( true );

			if ( props.onFinishMediaUploadWithFailure ) {
				props.onFinishMediaUploadWithFailure( payload );
			}
		},
		[ props.onFinishMediaUploadWithFailure ]
	);

	const mediaUploadStateReset = useCallback(
		( payload ) => {
			setIsUploadInProgress( false );
			setIsUploadFailed( false );

			if ( props.onMediaUploadStateReset ) {
				props.onMediaUploadStateReset( payload );
			}
		},
		[ props.onMediaUploadStateReset ]
	);

	const addMediaUploadListener = useCallback( () => {
		// If we already have a subscription not worth doing it again.
		if ( subscriptionParentMediaUpload ) {
			return;
		}
		setSubscriptionParentMediaUpload(
			subscribeMediaUpload( ( payload ) => {
				mediaUpload( payload );
			} )
		);
	}, [ subscriptionParentMediaUpload ] );

	const removeMediaUploadListener = useCallback( () => {
		if ( subscriptionParentMediaUpload ) {
			subscriptionParentMediaUpload.remove();
		}
	}, [ subscriptionParentMediaUpload ] );

	useEffect( () => {
		setProgressBarStyle( [
			styles.progressBar,
			isUploadInProgress || styles.progressBarHidden,
			props.progressBarStyle,
		] );
	}, [ isUploadInProgress, props.progressBarStyle ] );

	useEffect( () => {
		addMediaUploadListener();

		return () => {
			removeMediaUploadListener();
		};
	}, [] );

	return useMemo(
		() => (
			<View
				style={ [ styles.mediaUploadProgress, props.containerStyle ] }
				pointerEvents="box-none"
			>
				<View style={ progressBarStyle }>
					{ isUploadInProgress && (
						<Spinner
							progress={ progress * 100 }
							style={ props.spinnerStyle }
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
		),
		[
			isUploadInProgress,
			isUploadFailed,
			progress,
			progressBarStyle,
			renderContent,
			props,
		]
	);
}

export default MediaUploadProgress;
