/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

export default function useSaveImage( {
	crop,
	rotation,
	height,
	width,
	aspect,
	url,
	id,
	onSaveImage,
	onFinishEditing,
} ) {
	const { createErrorNotice } = useDispatch( noticesStore );
	const [ isInProgress, setIsInProgress ] = useState( false );

	const cancel = useCallback( () => {
		setIsInProgress( false );
		onFinishEditing();
	}, [ setIsInProgress, onFinishEditing ] );

	const apply = useCallback( () => {
		setIsInProgress( true );

		let attrs = {};

		// The crop script may return some very small, sub-pixel values when the image was not cropped.
		// Crop only when the new size has changed by more than 0.1%.
		if ( crop.width < 99.9 || crop.height < 99.9 ) {
			attrs = crop;
		}

		if ( rotation > 0 ) {
			attrs.rotation = rotation;
		}

		attrs.src = url;

		apiFetch( {
			path: `/wp/v2/media/${ id }/edit`,
			method: 'POST',
			data: attrs,
		} )
			.then( ( response ) => {
				onSaveImage( {
					id: response.id,
					url: response.source_url,
					height: height && width ? width / aspect : undefined,
				} );
			} )
			.catch( ( error ) => {
				createErrorNotice(
					sprintf(
						/* translators: 1. Error message */
						__( 'Could not edit image. %s' ),
						error.message
					),
					{
						id: 'image-editing-error',
						type: 'snackbar',
					}
				);
			} )
			.finally( () => {
				setIsInProgress( false );
				onFinishEditing();
			} );
	}, [
		setIsInProgress,
		crop,
		rotation,
		height,
		width,
		aspect,
		url,
		onSaveImage,
		createErrorNotice,
		setIsInProgress,
		onFinishEditing,
	] );

	return useMemo(
		() => ( {
			isInProgress,
			apply,
			cancel,
		} ),
		[ isInProgress, apply, cancel ]
	);
}
