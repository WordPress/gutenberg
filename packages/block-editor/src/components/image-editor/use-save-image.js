/**
 * WordPress dependencies
 */
// Disable Reason: Needs to be refactored.
// eslint-disable-next-line no-restricted-imports
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

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

		const modifiers = [];

		if ( rotation > 0 ) {
			modifiers.push( {
				type: 'rotate',
				args: {
					angle: rotation,
				},
			} );
		}

		// The crop script may return some very small, sub-pixel values when the image was not cropped.
		// Crop only when the new size has changed by more than 0.1%.
		if ( crop.width < 99.9 || crop.height < 99.9 ) {
			modifiers.push( {
				type: 'crop',
				args: {
					left: crop.x,
					top: crop.y,
					width: crop.width,
					height: crop.height,
				},
			} );
		}

		apiFetch( {
			path: `/wp/v2/media/${ id }/edit`,
			method: 'POST',
			data: { src: url, modifiers },
		} )
			.then( ( response ) => {
				onSaveImage( {
					id: response.id,
					url: response.source_url,
				} );
			} )
			.catch( ( error ) => {
				createErrorNotice(
					sprintf(
						/* translators: 1. Error message */
						__( 'Could not edit image. %s' ),
						stripHTML( error.message )
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
