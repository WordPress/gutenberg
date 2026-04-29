/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

export const NOTICES_CONTEXT = 'media-editor';

const IMAGE_LOAD_ERROR_NOTICE_ID = 'media-editor-image-load-error';
const LOAD_TIMEOUT_MS = 5000;

interface UseLoadErrorNoticeArgs {
	id: number;
	hasMedia: boolean;
	isImage: boolean;
	mediaUrl?: string;
}

export function useLoadErrorNotice( {
	id,
	hasMedia,
	isImage,
	mediaUrl,
}: UseLoadErrorNoticeArgs ) {
	const { invalidateResolution } = useDispatch( coreStore );
	const { createErrorNotice, removeNotice } = useDispatch( noticesStore );
	const [ imageLoadRetryKey, setImageLoadRetryKey ] = useState( 0 );

	const clearImageLoadErrorNotice = useCallback( () => {
		removeNotice( IMAGE_LOAD_ERROR_NOTICE_ID, NOTICES_CONTEXT );
	}, [ removeNotice ] );

	const showImageLoadErrorNotice = useCallback(
		() =>
			createErrorNotice(
				__(
					'Could not load image. Please check your connection and try again.'
				),
				{
					id: IMAGE_LOAD_ERROR_NOTICE_ID,
					type: 'snackbar',
					context: NOTICES_CONTEXT,
				}
			),
		[ createErrorNotice ]
	);

	const retryMediaLoad = useCallback( () => {
		clearImageLoadErrorNotice();
		invalidateResolution( 'getEntityRecord', [
			'postType',
			'attachment',
			id,
		] );
		invalidateResolution( 'getEditedEntityRecord', [
			'postType',
			'attachment',
			id,
		] );
	}, [ clearImageLoadErrorNotice, id, invalidateResolution ] );

	const retryImageLoad = useCallback( () => {
		clearImageLoadErrorNotice();
		setImageLoadRetryKey( ( key ) => key + 1 );
	}, [ clearImageLoadErrorNotice ] );

	useEffect( () => {
		retryMediaLoad();
	}, [ retryMediaLoad ] );

	useEffect( () => {
		if ( hasMedia ) {
			return;
		}

		if ( navigator.onLine === false ) {
			showImageLoadErrorNotice();
			return;
		}

		const timeout = setTimeout( showImageLoadErrorNotice, LOAD_TIMEOUT_MS );
		return () => {
			clearTimeout( timeout );
		};
	}, [ hasMedia, showImageLoadErrorNotice ] );

	useEffect( () => {
		if ( hasMedia && isImage && ! mediaUrl ) {
			showImageLoadErrorNotice();
		}
	}, [ hasMedia, isImage, mediaUrl, showImageLoadErrorNotice ] );

	useEffect( () => {
		const handleOnline = () => {
			if ( ! hasMedia ) {
				retryMediaLoad();
				return;
			}
			if ( isImage ) {
				retryImageLoad();
			}
		};

		window.addEventListener( 'online', handleOnline );
		return () => {
			window.removeEventListener( 'online', handleOnline );
		};
	}, [ hasMedia, isImage, retryImageLoad, retryMediaLoad ] );

	return {
		clearImageLoadErrorNotice,
		imageLoadRetryKey,
		showImageLoadErrorNotice,
	};
}
